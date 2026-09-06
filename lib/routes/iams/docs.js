const express = require('express');
const router = express.Router();
const { WorkspaceDoc } = require('../../models/WorkspaceDoc');
const { verifyToken } = require('../../middleware/auth');
const { resolveWorkspace, scopedProjectAccess } = require('../../middleware/tenantIsolation');
const { logAudit, logUserEvent } = require('../../utils/audit');

router.use(verifyToken);
router.use(resolveWorkspace);

/**
 * GET /api/iams/docs
 * List docs for workspace/project
 */
router.get('/', async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const { project_id, search, category } = req.query;

    const query = { workspace_id: wsId, is_archived: false };

    // Guest scoping
    if (req.workspaceMembership?.role === 'GUEST' || req.workspaceMembership?.role === 'CLIENT_VIEWER') {
      const allowed = req.workspaceMembership.assigned_projects || [];
      if (project_id && !allowed.includes(project_id)) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
      }
      query.project_id = project_id ? project_id : { $in: allowed };
    } else if (project_id) {
      query.project_id = project_id;
    }

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    // Return summaries without heavy version histories for fast listing
    const docs = await WorkspaceDoc.find(query, {
      version_history: 0
    }).sort({ is_pinned: -1, updated_at: -1 });

    res.json({
      success: true,
      count: docs.length,
      data: docs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/docs
 * Create a new rich-text document
 */
router.post('/', scopedProjectAccess('project_id'), async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const { project_id, title, content_html, content_json, category = 'WIKI', tags = [], icon } = req.body;

    if (!project_id || !title) {
      return res.status(400).json({ success: false, error: 'Project ID and Title are required.' });
    }

    const docId = 'doc_' + Math.random().toString(36).substring(2, 9);

    const newDoc = new WorkspaceDoc({
      doc_id: docId,
      workspace_id: wsId,
      project_id,
      title,
      icon: icon || 'file-text',
      category,
      content_json: content_json || { type: 'doc', content: [] },
      content_html: content_html || '<p>Start writing your project document...</p>',
      current_version: 1,
      version_history: [
        {
          version_number: 1,
          content_json: content_json || { type: 'doc', content: [] },
          content_html: content_html || '<p>Start writing your project document...</p>',
          saved_by: req.user.full_name || 'Team Member',
          created_at: new Date()
        }
      ],
      created_by: userId,
      last_edited_by: req.user.full_name || 'Team Member'
    });

    await newDoc.save();

    await logAudit({
      req,
      action: 'DOC_CREATED',
      entityType: 'DOC',
      entityId: newDoc.doc_id,
      severity: 'INFO',
      after: newDoc.toObject(),
      details: { title: newDoc.title, category: newDoc.category, project_id }
    });
    await logUserEvent({
      req,
      eventType: 'CREATE_DOC',
      entityType: 'DOC',
      entityId: newDoc.doc_id
    });

    res.status(201).json({
      success: true,
      message: 'Document created.',
      data: newDoc
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/iams/docs/:doc_id
 * Get single document with full JSON/HTML body and version history
 */
router.get('/:doc_id', async (req, res) => {
  try {
    const { doc_id } = req.params;
    const doc = await WorkspaceDoc.findOne({
      doc_id,
      workspace_id: req.workspace.workspace_id
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    await logUserEvent({
      req,
      eventType: 'VIEW_DOC',
      entityType: 'DOC',
      entityId: doc.doc_id
    });

    res.json({
      success: true,
      data: doc
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/iams/docs/:doc_id
 * Update document content with auto-version snapshot support
 */
router.put('/:doc_id', async (req, res) => {
  try {
    const { doc_id } = req.params;
    const { title, content_html, content_json, is_pinned, create_snapshot } = req.body;
    const editorName = req.user.full_name || req.user.email || 'Team Member';

    const doc = await WorkspaceDoc.findOne({
      doc_id,
      workspace_id: req.workspace.workspace_id
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const beforeState = { title: doc.title, is_pinned: doc.is_pinned, version: doc.current_version };

    if (title !== undefined) doc.title = title;
    if (content_html !== undefined) doc.content_html = content_html;
    if (content_json !== undefined) doc.content_json = content_json;
    if (is_pinned !== undefined) doc.is_pinned = is_pinned;

    doc.last_edited_by = editorName;
    doc.updated_at = new Date();

    if (create_snapshot) {
      doc.current_version += 1;
      doc.version_history.push({
        version_number: doc.current_version,
        content_json: doc.content_json,
        content_html: doc.content_html,
        saved_by: editorName,
        created_at: new Date()
      });
    }

    await doc.save();
    const afterState = { title: doc.title, is_pinned: doc.is_pinned, version: doc.current_version };

    await logAudit({
      req,
      action: 'DOC_UPDATED',
      entityType: 'DOC',
      entityId: doc.doc_id,
      severity: 'INFO',
      before: beforeState,
      after: afterState,
      details: { title: doc.title, snapshot_created: !!create_snapshot }
    });
    await logUserEvent({
      req,
      eventType: 'EDIT_DOC',
      entityType: 'DOC',
      entityId: doc.doc_id
    });

    res.json({
      success: true,
      message: 'Document saved.',
      data: {
        doc_id: doc.doc_id,
        current_version: doc.current_version,
        updated_at: doc.updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/docs/:doc_id/restore/:version_number
 * Restore previous version snapshot
 */
router.post('/:doc_id/restore/:version_number', async (req, res) => {
  try {
    const { doc_id, version_number } = req.params;
    const doc = await WorkspaceDoc.findOne({
      doc_id,
      workspace_id: req.workspace.workspace_id
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const targetVersion = doc.version_history.find(v => v.version_number === parseInt(version_number, 10));
    if (!targetVersion) {
      return res.status(404).json({ success: false, error: `Version ${version_number} not found.` });
    }

    doc.content_json = targetVersion.content_json;
    doc.content_html = targetVersion.content_html;
    doc.current_version += 1;
    doc.last_edited_by = req.user.full_name || 'Team Member';
    doc.updated_at = new Date();

    doc.version_history.push({
      version_number: doc.current_version,
      content_json: doc.content_json,
      content_html: doc.content_html,
      saved_by: `Restored v${version_number} by ${doc.last_edited_by}`,
      created_at: new Date()
    });

    await doc.save();

    await logAudit({
      req,
      action: 'DOC_VERSION_RESTORED',
      entityType: 'DOC',
      entityId: doc.doc_id,
      severity: 'WARN',
      details: { version_number: parseInt(version_number, 10), new_version: doc.current_version }
    });
    await logUserEvent({
      req,
      eventType: 'RESTORE_DOC_VERSION',
      entityType: 'DOC',
      entityId: doc.doc_id
    });

    res.json({
      success: true,
      message: `Document successfully restored to version ${version_number}.`,
      data: doc
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
