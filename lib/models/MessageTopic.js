const mongoose = require('mongoose');

const MessageReplySchema = new mongoose.Schema({
  reply_id: {
    type: String,
    default: () => `rpl_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
  },
  author_id: {
    type: String,
    default: function() { return this.author?.user_id || 'usr_demo_admin'; }
  },
  author_name: {
    type: String,
    default: function() { return this.author?.full_name || 'Team Member'; }
  },
  author_avatar: {
    type: String,
    default: function() { return this.author?.avatar || ''; }
  },
  author: {
    user_id: String,
    full_name: String,
    email: String,
    avatar: String
  },
  body_html: {
    type: String,
    default: function() { return this.content_html || '<p></p>'; }
  },
  content_html: {
    type: String,
    default: function() { return this.body_html || '<p></p>'; }
  },
  body_json: { type: mongoose.Schema.Types.Mixed, default: null },
  content_json: { type: mongoose.Schema.Types.Mixed, default: null },
  attachments: [{
    name: String,
    url: String,
    size: Number,
    mime_type: String
  }],
  reactions: [{
    emoji: String,
    count: Number,
    users: [String]
  }],
  created_at: { type: Date, default: Date.now }
}, { _id: false });

const MessageTopicSchema = new mongoose.Schema({
  topic_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `top_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  },
  workspace_id: {
    type: String,
    required: true,
    index: true
  },
  project_id: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['ANNOUNCEMENT', 'IDEA', 'UPDATE', 'MEETING_NOTES', 'QUESTION', 'GENERAL', 'ARCHITECTURE', 'CLIENT_UPDATE', 'RETROSPECTIVE'],
    default: 'GENERAL',
    index: true
  },
  body_html: {
    type: String,
    default: function() { return this.content_html || '<p></p>'; }
  },
  content_html: {
    type: String,
    default: function() { return this.body_html || '<p></p>'; }
  },
  body_json: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  content_json: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  author: {
    user_id: { type: String, default: 'usr_demo_admin' },
    full_name: { type: String, default: 'Team Member' },
    avatar_url: { type: String, default: '' },
    avatar: { type: String, default: '' },
    email: { type: String, default: '' },
    role: { type: String, default: 'MEMBER' }
  },
  task_id: {
    type: String,
    default: null,
    index: true
  },
  subtask_id: {
    type: String,
    default: null,
    index: true
  },
  task_title: {
    type: String,
    default: ''
  },
  is_pinned: {
    type: Boolean,
    default: false
  },
  subscribers: [{
    type: String // user_ids
  }],
  replies: [MessageReplySchema],
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Composite index
MessageTopicSchema.index({ workspace_id: 1, project_id: 1, category: 1, created_at: -1 });
MessageTopicSchema.index({ workspace_id: 1, task_id: 1 });

const MessageTopic = mongoose.models.MessageTopic || mongoose.model('MessageTopic', MessageTopicSchema);
module.exports = MessageTopic;
module.exports.MessageTopic = MessageTopic;
