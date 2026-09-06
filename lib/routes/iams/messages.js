const express = require('express');
const router = express.Router();
const { MessageTopic } = require('../../models/MessageTopic');
const { verifyToken } = require('../../middleware/auth');
const { resolveWorkspace, scopedProjectAccess } = require('../../middleware/tenantIsolation');
const { logAudit, logUserEvent } = require('../../utils/audit');

router.use(verifyToken);
router.use(resolveWorkspace);

/**
 * GET /api/iams/messages
 * List async message topics for a workspace/project
 */
router.get('/', async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const { project_id, category, search } = req.query;

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
        { title: { $regex: search, $options: 'i' } },
        { content_html: { $regex: search, $options: 'i' } }
      ];
    }

    const topics = await MessageTopic.find(query).sort({ is_pinned: -1, last_activity_at: -1 });

    res.json({
      success: true,
      count: topics.length,
      data: topics
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/messages
 * Create a new async message topic (Basecamp style)
 */
router.post('/', scopedProjectAccess('project_id'), async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const { project_id, title, content_html, content_json, category = 'GENERAL', tags = [], attachments = [] } = req.body;

    if (!project_id || !title || !content_html) {
      return res.status(400).json({ success: false, error: 'Project ID, Title, and Content are required.' });
    }

    const topicId = 'top_' + Math.random().toString(36).substring(2, 9);

    const newTopic = new MessageTopic({
      topic_id: topicId,
      workspace_id: wsId,
      project_id,
      title,
      content_html,
      content_json: content_json || {},
      category,
      author: {
        user_id: userId,
        full_name: req.user.full_name || 'Team Member',
        email: req.user.email || 'admin@icebergma.com',
        avatar: req.user.avatar || ''
      },
      tags,
      attachments,
      replies_count: 0,
      last_activity_at: new Date()
    });

    await newTopic.save();

    await logAudit({
      req,
      action: 'TOPIC_CREATED',
      entityType: 'MESSAGE_TOPIC',
      entityId: newTopic.topic_id,
      severity: 'INFO',
      after: newTopic.toObject(),
      details: { title: newTopic.title, category: newTopic.category }
    });
    await logUserEvent({
      req,
      eventType: 'CREATE_MESSAGE_TOPIC',
      entityType: 'MESSAGE_TOPIC',
      entityId: newTopic.topic_id
    });

    res.status(201).json({
      success: true,
      message: 'Message topic posted.',
      data: newTopic
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/iams/messages/:topic_id
 * Get single message topic with its full thread of replies
 */
router.get('/:topic_id', async (req, res) => {
  try {
    const { topic_id } = req.params;
    const topic = await MessageTopic.findOne({
      topic_id,
      workspace_id: req.workspace.workspace_id
    });

    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found.' });
    }

    await logUserEvent({
      req,
      eventType: 'VIEW_MESSAGE_TOPIC',
      entityType: 'MESSAGE_TOPIC',
      entityId: topic.topic_id
    });

    res.json({
      success: true,
      data: topic
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/messages/:topic_id/replies
 * Add a threaded reply to a message topic
 */
router.post('/:topic_id/replies', async (req, res) => {
  try {
    const { topic_id } = req.params;
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const { content_html, attachments = [] } = req.body;

    if (!content_html) {
      return res.status(400).json({ success: false, error: 'Reply content is required.' });
    }

    const topic = await MessageTopic.findOne({
      topic_id,
      workspace_id: req.workspace.workspace_id
    });

    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found.' });
    }

    const replyId = 'rep_' + Math.random().toString(36).substring(2, 9);
    const newReply = {
      reply_id: replyId,
      author: {
        user_id: userId,
        full_name: req.user.full_name || 'Team Member',
        email: req.user.email || 'admin@icebergma.com',
        avatar: req.user.avatar || ''
      },
      content_html,
      attachments,
      reactions: [],
      created_at: new Date()
    };

    topic.replies.push(newReply);
    topic.replies_count = topic.replies.length;
    topic.last_activity_at = new Date();

    await topic.save();

    await logAudit({
      req,
      action: 'TOPIC_REPLIED',
      entityType: 'MESSAGE_TOPIC',
      entityId: topic.topic_id,
      severity: 'INFO',
      details: { reply_id: replyId }
    });
    await logUserEvent({
      req,
      eventType: 'REPLY_MESSAGE_TOPIC',
      entityType: 'MESSAGE_TOPIC',
      entityId: topic.topic_id
    });

    res.status(201).json({
      success: true,
      message: 'Reply posted.',
      data: newReply,
      topic_summary: {
        replies_count: topic.replies_count,
        last_activity_at: topic.last_activity_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/iams/messages/:topic_id/pin
 * Toggle pin status
 */
router.put('/:topic_id/pin', async (req, res) => {
  try {
    const { topic_id } = req.params;
    const topic = await MessageTopic.findOne({
      topic_id,
      workspace_id: req.workspace.workspace_id
    });

    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found.' });
    }

    topic.is_pinned = !topic.is_pinned;
    await topic.save();

    await logAudit({
      req,
      action: 'TOPIC_PINNED',
      entityType: 'MESSAGE_TOPIC',
      entityId: topic.topic_id,
      severity: 'INFO',
      details: { is_pinned: topic.is_pinned }
    });
    await logUserEvent({
      req,
      eventType: 'PIN_MESSAGE_TOPIC',
      entityType: 'MESSAGE_TOPIC',
      entityId: topic.topic_id
    });

    res.json({
      success: true,
      message: `Topic ${topic.is_pinned ? 'pinned' : 'unpinned'}.`,
      data: { is_pinned: topic.is_pinned }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
