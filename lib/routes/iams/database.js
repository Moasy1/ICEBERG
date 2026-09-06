const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const BackupSnapshot = require('../../models/BackupSnapshot');
const { verifyToken, authorizeRoles } = require('../../middleware/auth');
const { logAudit, logUserEvent } = require('../../utils/audit');

// Preload all models into Mongoose model registry
const modelsDir = path.join(__dirname, '../../models');
if (fs.existsSync(modelsDir)) {
  fs.readdirSync(modelsDir).forEach(file => {
    if (file.endsWith('.js')) {
      try {
        require(path.join(modelsDir, file));
      } catch (e) {
        // Ignore files that export objects or are non-schema
      }
    }
  });
}

// Protected collections that cannot be edited or deleted through the toolkit
const PROTECTED_COLLECTIONS = ['users', 'auditlogs', 'user'];

// Helper to resolve model by collection or model name
function getModelByName(name) {
  const normalized = name.toLowerCase();
  for (const modelKey of Object.keys(mongoose.models)) {
    const m = mongoose.models[modelKey];
    if (
      modelKey.toLowerCase() === normalized ||
      m.collection.collectionName.toLowerCase() === normalized
    ) {
      return m;
    }
  }
  return null;
}

// All Database operations are restricted to CEO
router.use(verifyToken);
router.use(authorizeRoles('CEO'));

/**
 * GET /api/iams/database/collections
 * List all Mongoose models with document counts and index counts
 */
router.get('/collections', async (req, res) => {
  try {
    const collectionsList = [];

    for (const [modelName, model] of Object.entries(mongoose.models)) {
      try {
        const collectionName = model.collection.collectionName;
        const [docCount, indexes] = await Promise.all([
          model.countDocuments().catch(() => 0),
          model.collection.indexes().catch(() => [])
        ]);

        collectionsList.push({
          model_name: modelName,
          collection_name: collectionName,
          document_count: docCount,
          index_count: indexes.length,
          is_protected: PROTECTED_COLLECTIONS.includes(collectionName.toLowerCase()) || PROTECTED_COLLECTIONS.includes(modelName.toLowerCase())
        });
      } catch (e) {
        collectionsList.push({
          model_name: modelName,
          collection_name: model.collection?.collectionName || modelName,
          document_count: 0,
          index_count: 0,
          is_protected: false
        });
      }
    }

    // Sort alphabetically
    collectionsList.sort((a, b) => a.collection_name.localeCompare(b.collection_name));

    res.json({
      success: true,
      count: collectionsList.length,
      collections: collectionsList
    });
  } catch (err) {
    console.error('[IAMS DB Collections Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to inspect database collections.' });
  }
});

/**
 * GET /api/iams/database/collections/:name/schema
 * Schema structure, sample document, and indexes for a collection
 */
router.get('/collections/:name/schema', async (req, res) => {
  try {
    const model = getModelByName(req.params.name);
    if (!model) {
      return res.status(404).json({ success: false, error: `Collection ${req.params.name} not found.` });
    }

    const schemaPaths = {};
    model.schema.eachPath((pathname, schemaType) => {
      schemaPaths[pathname] = {
        instance: schemaType.instance,
        isRequired: !!schemaType.isRequired,
        defaultValue: schemaType.defaultValue !== undefined ? String(schemaType.defaultValue) : undefined
      };
    });

    const [indexes, sampleDoc] = await Promise.all([
      model.collection.indexes().catch(() => []),
      model.findOne().lean().catch(() => null)
    ]);

    res.json({
      success: true,
      model_name: model.modelName,
      collection_name: model.collection.collectionName,
      fields: schemaPaths,
      indexes,
      sample_document: sampleDoc
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/iams/database/collections/:name/documents
 * Paginated documents browse with regex search and sorting
 */
router.get('/collections/:name/documents', async (req, res) => {
  try {
    const model = getModelByName(req.params.name);
    if (!model) {
      return res.status(404).json({ success: false, error: `Collection ${req.params.name} not found.` });
    }

    const { q, sort = '-_id', fields, page = 1, limit = 25 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    let query = {};
    if (q) {
      // Build search across all string fields defined in schema
      const stringPaths = [];
      model.schema.eachPath((pathname, schemaType) => {
        if (schemaType.instance === 'String' && !pathname.includes('password')) {
          stringPaths.push({ [pathname]: { $regex: q, $options: 'i' } });
        }
      });

      if (stringPaths.length > 0) {
        query = { $or: stringPaths };
      }
    }

    let projection = {};
    if (fields) {
      fields.split(',').forEach(f => { projection[f.trim()] = 1; });
    }

    // Always omit password
    projection.password = 0;

    const [total, documents] = await Promise.all([
      model.countDocuments(query),
      model.find(query, projection)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    res.json({
      success: true,
      collection: model.collection.collectionName,
      total,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(total / limitNum),
      documents
    });
  } catch (err) {
    console.error('[IAMS DB Documents Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/iams/database/collections/:name/documents/:id
 * Retrieve a single document in full
 */
router.get('/collections/:name/documents/:id', async (req, res) => {
  try {
    const model = getModelByName(req.params.name);
    if (!model) return res.status(404).json({ success: false, error: 'Collection not found.' });

    const { id } = req.params;
    let doc = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      doc = await model.findById(id).select('-password').lean();
    }
    if (!doc) {
      // Try string ID matching (e.g. client_id, project_id, task_id, log_id)
      const idFields = ['client_id', 'project_id', 'task_id', 'log_id', 'opportunity_id', 'event_id', 'snapshot_id', 'doc_id', 'topic_id', 'user_id', 'id'];
      const orClauses = idFields.map(f => ({ [f]: id }));
      doc = await model.findOne({ $or: orClauses }).select('-password').lean();
    }

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    res.json({ success: true, document: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/iams/database/collections/:name/documents/:id
 * In-place edit with security checks
 */
router.patch('/collections/:name/documents/:id', async (req, res) => {
  try {
    const model = getModelByName(req.params.name);
    if (!model) return res.status(404).json({ success: false, error: 'Collection not found.' });

    const collectionName = model.collection.collectionName.toLowerCase();
    if (PROTECTED_COLLECTIONS.includes(collectionName) || PROTECTED_COLLECTIONS.includes(model.modelName.toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: `In-place edits to protected collection '${model.collection.collectionName}' are blocked for security.`
      });
    }

    const { id } = req.params;
    const updates = { ...req.body };

    // Blacklist sensitive fields
    delete updates._id;
    delete updates.id;
    delete updates.password;
    delete updates.token;

    let targetQuery = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      targetQuery = { _id: id };
    } else {
      const idFields = ['client_id', 'project_id', 'task_id', 'opportunity_id', 'doc_id', 'topic_id', 'log_id'];
      targetQuery = { $or: idFields.map(f => ({ [f]: id })) };
    }

    const beforeDoc = await model.findOne(targetQuery).lean();
    if (!beforeDoc) {
      return res.status(404).json({ success: false, error: 'Target document not found.' });
    }

    const updated = await model.findOneAndUpdate(
      targetQuery,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    await logAudit({
      req,
      action: 'DB_DOCUMENT_EDITED',
      entityType: 'SYSTEM',
      entityId: `${model.collection.collectionName}:${id}`,
      severity: 'WARN',
      before: beforeDoc,
      after: updated,
      details: { collection: model.collection.collectionName, id }
    });

    res.json({
      success: true,
      message: 'Document updated successfully.',
      document: updated
    });
  } catch (err) {
    console.error('[IAMS DB PATCH Document Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/iams/database/collections/:name/documents/:id
 * Hard delete document with security block
 */
router.delete('/collections/:name/documents/:id', async (req, res) => {
  try {
    const model = getModelByName(req.params.name);
    if (!model) return res.status(404).json({ success: false, error: 'Collection not found.' });

    const collectionName = model.collection.collectionName.toLowerCase();
    if (PROTECTED_COLLECTIONS.includes(collectionName) || PROTECTED_COLLECTIONS.includes(model.modelName.toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: `Deletions from protected collection '${model.collection.collectionName}' are blocked for security.`
      });
    }

    const { id } = req.params;
    let targetQuery = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      targetQuery = { _id: id };
    } else {
      const idFields = ['client_id', 'project_id', 'task_id', 'opportunity_id', 'doc_id', 'topic_id', 'log_id'];
      targetQuery = { $or: idFields.map(f => ({ [f]: id })) };
    }

    const beforeDoc = await model.findOne(targetQuery).lean();
    if (!beforeDoc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    await model.findOneAndDelete(targetQuery);

    await logAudit({
      req,
      action: 'DB_DOCUMENT_DELETED',
      entityType: 'SYSTEM',
      entityId: `${model.collection.collectionName}:${id}`,
      severity: 'CRITICAL',
      before: beforeDoc,
      details: { collection: model.collection.collectionName, id }
    });

    res.json({
      success: true,
      message: 'Document deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/iams/database/health
 * MongoDB health metrics, storage stats, and write activity
 */
router.get('/health', async (req, res) => {
  try {
    const stats = {};
    let totalDocs = 0;
    const collectionBreakdown = [];

    for (const [modelName, model] of Object.entries(mongoose.models)) {
      try {
        const count = await model.countDocuments();
        totalDocs += count;
        collectionBreakdown.push({
          collection: model.collection.collectionName,
          model: modelName,
          count
        });
      } catch (e) {}
    }

    // Sort by count descending
    collectionBreakdown.sort((a, b) => b.count - a.count);

    // Recent writes (AuditLog + UserEvent in last hour)
    let writesLastHour = 0;
    try {
      if (mongoose.connection.readyState === 1) {
        const oneHourAgo = new Date(Date.now() - 3600000);
        if (mongoose.models.AuditLog) {
          writesLastHour += await mongoose.models.AuditLog.countDocuments({ created_at: { $gte: oneHourAgo } }).catch(() => 0);
        }
        if (mongoose.models.UserEvent) {
          writesLastHour += await mongoose.models.UserEvent.countDocuments({ created_at: { $gte: oneHourAgo } }).catch(() => 0);
        }
      }
    } catch (e) {}

    res.json({
      success: true,
      health: {
        database_name: mongoose.connection.name || 'iceberg_production',
        connection_state: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
        total_collections: Object.keys(mongoose.models).length,
        total_documents: totalDocs,
        writes_last_hour: writesLastHour,
        collection_breakdown: collectionBreakdown
      }
    });
  } catch (err) {
    console.error('[IAMS DB Health Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve database health metrics.' });
  }
});

/**
 * GET /api/iams/database/export/:name
 * Stream CSV or JSON export for a single collection
 */
router.get('/export/:name', async (req, res) => {
  try {
    const model = getModelByName(req.params.name);
    if (!model) return res.status(404).json({ success: false, error: 'Collection not found.' });

    const format = req.query.format || 'json';
    const docs = await model.find().select('-password').lean();

    // Log the export event
    await logAudit({
      req,
      action: 'DB_COLLECTION_EXPORTED',
      entityType: 'SYSTEM',
      entityId: model.collection.collectionName,
      severity: 'INFO',
      details: { format, document_count: docs.length }
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${model.collection.collectionName}_export.csv"`);

      if (docs.length === 0) {
        return res.send('_id\n');
      }

      const keys = Object.keys(docs[0]);
      res.write(keys.join(',') + '\n');

      for (const d of docs) {
        const row = keys.map(k => {
          const val = d[k];
          if (val === null || val === undefined) return '""';
          if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        res.write(row.join(',') + '\n');
      }
      return res.end();
    }

    // Default JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${model.collection.collectionName}_export.json"`);
    res.json({
      collection: model.collection.collectionName,
      count: docs.length,
      exported_at: new Date().toISOString(),
      data: docs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/database/export/all
 * Bulk export of all collections compiled into a JSON archive
 */
router.post('/export/all', async (req, res) => {
  try {
    const archive = {};
    let totalDocs = 0;
    const collectionsExported = [];

    for (const [modelName, model] of Object.entries(mongoose.models)) {
      try {
        const collName = model.collection.collectionName;
        const docs = await model.find().select('-password').lean();
        archive[collName] = docs;
        totalDocs += docs.length;
        collectionsExported.push(collName);
      } catch (e) {}
    }

    const payload = JSON.stringify(archive, null, 2);
    const sizeBytes = Buffer.byteLength(payload, 'utf8');

    // Create BackupSnapshot record
    const snapshot = await BackupSnapshot.create({
      type: 'FULL_DB',
      collections: collectionsExported,
      size_bytes: sizeBytes,
      document_count: totalDocs,
      created_by: req.user?.email || 'admin@icebergma.com',
      download_path: 'inline_export'
    });

    await logAudit({
      req,
      action: 'DB_FULL_BACKUP_GENERATED',
      entityType: 'SYSTEM',
      entityId: snapshot.snapshot_id,
      severity: 'WARN',
      details: { total_collections: collectionsExported.length, total_documents: totalDocs, size_bytes: sizeBytes }
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="iceberg_db_snapshot_${Date.now()}.json"`);
    res.send(payload);
  } catch (err) {
    console.error('[IAMS DB Export All Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to create bulk database export.' });
  }
});

/**
 * GET /api/iams/database/backups
 * List BackupSnapshot documents + on-disk JSONL backup files
 */
router.get('/backups', async (req, res) => {
  try {
    const snapshots = await BackupSnapshot.find().sort({ created_at: -1 }).limit(20).lean();

    // Check on-disk backup files in lib/
    const diskBackups = [];
    const baseDir = path.join(__dirname, '../../');
    const knownFiles = [
      'leads_backup.jsonl',
      'notifications_backup.jsonl',
      'iams_audit_backup.jsonl'
    ];

    knownFiles.forEach(file => {
      const fullPath = path.join(baseDir, file);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        diskBackups.push({
          filename: file,
          size_bytes: stat.size,
          last_modified: stat.mtime,
          type: 'DISK_JSONL'
        });
      }
    });

    res.json({
      success: true,
      snapshots,
      disk_backups: diskBackups
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/iams/database/backups/:filename/download
 * Secure stream download for on-disk backup files
 */
router.get('/backups/:filename/download', async (req, res) => {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../../', safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Backup file not found.' });
    }

    res.setHeader('Content-Type', 'application/x-jsonlines');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
