const express = require('express');
const router = express.Router();
const { ProjectBookmark } = require('../../models/ProjectBookmark');
const { fetchOpenGraphMetadata } = require('../../services/openGraphScraper');
const { verifyToken } = require('../../middleware/auth');
const { resolveWorkspace, scopedProjectAccess } = require('../../middleware/tenantIsolation');
const { logAudit, logUserEvent } = require('../../utils/audit');

router.use(verifyToken);
router.use(resolveWorkspace);

/**
 * GET /api/iams/bookmarks
 * List bookmarks for project/workspace
 */
router.get('/', async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const { project_id, tag } = req.query;

    const query = { workspace_id: wsId };

    if (req.workspaceMembership?.role === 'GUEST' || req.workspaceMembership?.role === 'CLIENT_VIEWER') {
      const allowed = req.workspaceMembership.assigned_projects || [];
      if (project_id && !allowed.includes(project_id)) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
      }
      query.project_id = project_id ? project_id : { $in: allowed };
    } else if (project_id) {
      query.project_id = project_id;
    }

    if (tag) query.tags = tag;

    const bookmarks = await ProjectBookmark.find(query).sort({ is_pinned: -1, created_at: -1 });

    res.json({
      success: true,
      count: bookmarks.length,
      data: bookmarks
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/bookmarks
 * Add a new link bookmark with automatic OpenGraph metadata scraping
 */
router.post('/', scopedProjectAccess('project_id'), async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const { project_id, url, title, notes, tags = [] } = req.body;

    if (!project_id || !url) {
      return res.status(400).json({ success: false, error: 'Project ID and URL are required.' });
    }

    // Scrape OpenGraph metadata
    let ogData = {};
    try {
      ogData = await fetchOpenGraphMetadata(url);
    } catch (e) {
      console.warn('Could not scrape OG metadata for', url, e.message);
    }

    const bookmarkId = 'bmk_' + Math.random().toString(36).substring(2, 9);

    const newBookmark = new ProjectBookmark({
      bookmark_id: bookmarkId,
      workspace_id: wsId,
      project_id,
      url,
      title: title || ogData.title || url,
      description: ogData.description || '',
      image_url: ogData.image_url || '',
      favicon_url: ogData.favicon_url || '',
      domain: ogData.domain || '',
      notes: notes || '',
      tags,
      created_by: userId
    });

    await newBookmark.save();

    await logAudit({
      req,
      action: 'BOOKMARK_CREATED',
      entityType: 'BOOKMARK',
      entityId: newBookmark.bookmark_id,
      severity: 'INFO',
      after: newBookmark.toObject(),
      details: { url, title: newBookmark.title, domain: newBookmark.domain }
    });
    await logUserEvent({
      req,
      eventType: 'CREATE_BOOKMARK',
      entityType: 'BOOKMARK',
      entityId: newBookmark.bookmark_id
    });

    res.status(201).json({
      success: true,
      message: 'Bookmark added with metadata preview.',
      data: newBookmark
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/iams/bookmarks/:bookmark_id
 * Remove a bookmark
 */
router.delete('/:bookmark_id', async (req, res) => {
  try {
    const { bookmark_id } = req.params;
    const deleted = await ProjectBookmark.findOneAndDelete({
      bookmark_id,
      workspace_id: req.workspace.workspace_id
    });

    await logAudit({
      req,
      action: 'BOOKMARK_DELETED',
      entityType: 'BOOKMARK',
      entityId: bookmark_id,
      severity: 'INFO',
      before: deleted ? deleted.toObject() : null,
      details: { bookmark_id }
    });
    await logUserEvent({
      req,
      eventType: 'DELETE_BOOKMARK',
      entityType: 'BOOKMARK',
      entityId: bookmark_id
    });

    res.json({
      success: true,
      message: 'Bookmark removed.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
