const express = require('express');
const router = express.Router();
const AuditLog = require('../../models/AuditLog');
const { verifyToken, authorizeRoles } = require('../../middleware/auth');

// All audit routes are CEO-only (with automatic legacy SUPER_ADMIN mapping via roleMatrix)
router.use(verifyToken);
router.use(authorizeRoles('CEO'));

/**
 * GET /api/iams/audit
 * Paginated, filterable audit log query
 */
router.get('/', async (req, res) => {
  try {
    const {
      entity_type,
      user_email,
      action,
      severity,
      from,
      to,
      q,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    if (entity_type) query.entity_type = entity_type;
    if (user_email) query.user_email = { $regex: user_email, $options: 'i' };
    if (action) query.action = action;
    if (severity) query.severity = severity;

    if (from || to) {
      query.created_at = {};
      if (from) query.created_at.$gte = new Date(from);
      if (to) query.created_at.$lte = new Date(to);
    }

    if (q) {
      query.$or = [
        { action: { $regex: q, $options: 'i' } },
        { user_email: { $regex: q, $options: 'i' } },
        { entity_id: { $regex: q, $options: 'i' } },
        { ip_address: { $regex: q, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(total / limitNum),
      logs
    });
  } catch (err) {
    console.error('[IAMS Audit Log GET Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to query audit logs.' });
  }
});

/**
 * GET /api/iams/audit/summary
 * Quick header KPIs for the Audit Center
 */
router.get('/summary', async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [eventsToday, criticalThisWeek, topUserAgg, mostEditedEntityAgg, totalLogs] = await Promise.all([
      AuditLog.countDocuments({ created_at: { $gte: startOfToday } }),
      AuditLog.countDocuments({ severity: 'CRITICAL', created_at: { $gte: sevenDaysAgo } }),
      AuditLog.aggregate([
        { $match: { created_at: { $gte: sevenDaysAgo }, user_email: { $ne: 'system' } } },
        { $group: { _id: '$user_email', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),
      AuditLog.aggregate([
        { $match: { created_at: { $gte: sevenDaysAgo } } },
        { $group: { _id: '$entity_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),
      AuditLog.countDocuments()
    ]);

    res.json({
      success: true,
      summary: {
        events_today: eventsToday,
        critical_this_week: criticalThisWeek,
        top_user: topUserAgg.length ? { email: topUserAgg[0]._id, count: topUserAgg[0].count } : { email: 'None', count: 0 },
        most_edited_entity: mostEditedEntityAgg.length ? { type: mostEditedEntityAgg[0]._id, count: mostEditedEntityAgg[0].count } : { type: 'None', count: 0 },
        total_logs: totalLogs
      }
    });
  } catch (err) {
    console.error('[IAMS Audit Summary Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate audit summary.' });
  }
});

/**
 * GET /api/iams/audit/stats
 * Aggregations for charts: 30d activity sparkline, breakdown by entity_type, by user, top actions
 */
router.get('/stats', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [dailyTrends, entityBreakdown, topUsers, topActions, severityBreakdown] = await Promise.all([
      // Daily count over last 30 days
      AuditLog.aggregate([
        { $match: { created_at: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
            count: { $sum: 1 },
            critical: {
              $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Count by entity_type
      AuditLog.aggregate([
        { $match: { created_at: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$entity_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Top active actors
      AuditLog.aggregate([
        { $match: { created_at: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$user_email', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]),

      // Top actions
      AuditLog.aggregate([
        { $match: { created_at: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // By severity
      AuditLog.aggregate([
        { $match: { created_at: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        daily_trends: dailyTrends,
        by_entity: entityBreakdown,
        top_users: topUsers,
        top_actions: topActions,
        by_severity: severityBreakdown
      }
    });
  } catch (err) {
    console.error('[IAMS Audit Stats Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to compute audit statistics.' });
  }
});

/**
 * GET /api/iams/audit/suspicious
 * Pre-built security queries: failed logins, bulk deletes, after-hours activity, role denials
 */
router.get('/suspicious', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [failedLogins, deleteEvents, criticalEvents, recentSuspicious] = await Promise.all([
      // Failed logins
      AuditLog.find({
        action: 'AUTH_LOGIN_FAILED',
        created_at: { $gte: sevenDaysAgo }
      }).sort({ created_at: -1 }).limit(25).lean(),

      // Deletes across workspace/tasks/docs/entities
      AuditLog.find({
        action: { $regex: /DELETE|ARCHIVE|REMOVE/i },
        created_at: { $gte: sevenDaysAgo }
      }).sort({ created_at: -1 }).limit(25).lean(),

      // Critical severity logs
      AuditLog.find({
        severity: 'CRITICAL',
        created_at: { $gte: sevenDaysAgo }
      }).sort({ created_at: -1 }).limit(25).lean(),

      // Any other warnings or role denial attempts
      AuditLog.find({
        $or: [
          { action: { $regex: /DENIED|UNAUTHORIZED|FORBIDDEN/i } },
          { severity: 'WARN' }
        ],
        created_at: { $gte: sevenDaysAgo }
      }).sort({ created_at: -1 }).limit(25).lean()
    ]);

    res.json({
      success: true,
      suspicious: {
        failed_logins: failedLogins,
        deletions: deleteEvents,
        critical_alerts: criticalEvents,
        warnings: recentSuspicious
      }
    });
  } catch (err) {
    console.error('[IAMS Suspicious Query Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to query suspicious audit logs.' });
  }
});

/**
 * GET /api/iams/audit/users/:email/timeline
 * Activity timeline for a single user
 */
router.get('/users/:email/timeline', async (req, res) => {
  try {
    const { email } = req.params;
    const logs = await AuditLog.find({ user_email: email.toLowerCase() })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      email,
      count: logs.length,
      timeline: logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve user timeline.' });
  }
});

/**
 * GET /api/iams/audit/entity/:type/:id
 * Complete history of audit logs for a specific entity
 */
router.get('/entity/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const logs = await AuditLog.find({
      entity_type: type.toUpperCase(),
      entity_id: id
    })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      entity_type: type.toUpperCase(),
      entity_id: id,
      count: logs.length,
      history: logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve entity history.' });
  }
});

/**
 * GET /api/iams/audit/export
 * Export filtered audit logs as CSV or JSONL
 */
router.get('/export', async (req, res) => {
  try {
    const { entity_type, user_email, action, severity, from, to, format = 'csv' } = req.query;
    const query = {};

    if (entity_type) query.entity_type = entity_type;
    if (user_email) query.user_email = { $regex: user_email, $options: 'i' };
    if (action) query.action = action;
    if (severity) query.severity = severity;
    if (from || to) {
      query.created_at = {};
      if (from) query.created_at.$gte = new Date(from);
      if (to) query.created_at.$lte = new Date(to);
    }

    const logs = await AuditLog.find(query).sort({ created_at: -1 }).limit(5000).lean();

    if (format === 'jsonl') {
      res.setHeader('Content-Type', 'application/x-jsonlines');
      res.setHeader('Content-Disposition', `attachment; filename="audit_export_${Date.now()}.jsonl"`);
      for (const log of logs) {
        res.write(JSON.stringify(log) + '\n');
      }
      return res.end();
    }

    // Default: CSV format
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="audit_export_${Date.now()}.csv"`);

    const headers = ['Timestamp', 'Severity', 'User Email', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Details'];
    res.write(headers.join(',') + '\n');

    for (const log of logs) {
      const row = [
        `"${new Date(log.created_at).toISOString()}"`,
        `"${log.severity || 'INFO'}"`,
        `"${log.user_email || ''}"`,
        `"${log.action || ''}"`,
        `"${log.entity_type || ''}"`,
        `"${log.entity_id || ''}"`,
        `"${log.ip_address || ''}"`,
        `"${(JSON.stringify(log.details || {})).replace(/"/g, '""')}"`
      ];
      res.write(row.join(',') + '\n');
    }

    res.end();
  } catch (err) {
    console.error('[IAMS Audit Export Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to export audit logs.' });
  }
});

module.exports = router;
