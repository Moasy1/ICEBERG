const express = require('express');
const router = express.Router();
const { ChatMessage } = require('../../models/ChatMessage');
const { verifyToken } = require('../../middleware/auth');
const { resolveWorkspace } = require('../../middleware/tenantIsolation');
const { logAudit, logUserEvent } = require('../../utils/audit');

router.use(verifyToken);
router.use(resolveWorkspace);

/**
 * GET /api/iams/chat/messages
 * Retrieve messages for a channel or direct message thread
 */
router.get('/messages', async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const { channel_id, recipient_id, project_id, limit = 50, before } = req.query;

    const query = { workspace_id: wsId };

    if (channel_id) {
      query.channel_id = channel_id;
    } else if (recipient_id) {
      // Direct message conversation between userId and recipient_id
      query.$or = [
        { 'sender.user_id': userId, recipient_id: recipient_id },
        { 'sender.user_id': recipient_id, recipient_id: userId }
      ];
    } else if (project_id) {
      query.project_id = project_id;
    } else {
      query.channel_id = 'general';
    }

    if (before) {
      query.created_at = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(query)
      .sort({ created_at: 1 })
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/chat/messages
 * Send a chat message
 */
router.post('/messages', async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const { channel_id, recipient_id, project_id, text, attachments = [] } = req.body;

    if (!text && attachments.length === 0) {
      return res.status(400).json({ success: false, error: 'Message content or attachment is required.' });
    }

    const messageId = 'msg_' + Math.random().toString(36).substring(2, 9);

    const newChatMessage = new ChatMessage({
      message_id: messageId,
      workspace_id: wsId,
      project_id: project_id || null,
      channel_id: channel_id || (recipient_id ? null : 'general'),
      recipient_id: recipient_id || null,
      sender: {
        user_id: userId,
        full_name: req.user.full_name || 'Team Member',
        avatar: req.user.avatar || '',
        role: req.user.role || 'MEMBER'
      },
      text,
      attachments,
      reactions: [],
      created_at: new Date()
    });

    await newChatMessage.save();

    await logAudit({
      req,
      action: 'CHAT_MESSAGE_SENT',
      entityType: 'CHAT_MESSAGE',
      entityId: newChatMessage.message_id,
      severity: 'INFO',
      details: { channel_id: newChatMessage.channel_id, has_attachments: attachments.length > 0 }
    });
    await logUserEvent({
      req,
      eventType: 'SEND_CHAT_MESSAGE',
      entityType: 'CHAT_MESSAGE',
      entityId: newChatMessage.message_id
    });

    res.status(201).json({
      success: true,
      message: 'Message sent.',
      data: newChatMessage
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/chat/messages/:message_id/react
 * Add or toggle an emoji reaction
 */
router.post('/messages/:message_id/react', async (req, res) => {
  try {
    const { message_id } = req.params;
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, error: 'Emoji is required.' });
    }

    const message = await ChatMessage.findOne({
      message_id,
      workspace_id: req.workspace.workspace_id
    });

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found.' });
    }

    let reactionGroup = message.reactions.find(r => r.emoji === emoji);

    if (reactionGroup) {
      const uIndex = reactionGroup.users.indexOf(userId);
      if (uIndex > -1) {
        reactionGroup.users.splice(uIndex, 1);
        reactionGroup.count = reactionGroup.users.length;
        if (reactionGroup.count === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        reactionGroup.users.push(userId);
        reactionGroup.count = reactionGroup.users.length;
      }
    } else {
      message.reactions.push({
        emoji,
        count: 1,
        users: [userId]
      });
    }

    await message.save();

    await logAudit({
      req,
      action: 'CHAT_REACTION_ADDED',
      entityType: 'CHAT_MESSAGE',
      entityId: message.message_id,
      severity: 'INFO',
      details: { emoji }
    });
    await logUserEvent({
      req,
      eventType: 'REACT_CHAT_MESSAGE',
      entityType: 'CHAT_MESSAGE',
      entityId: message.message_id,
      metadata: { emoji }
    });

    res.json({
      success: true,
      data: message.reactions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
