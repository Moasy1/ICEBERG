const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  message_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  },
  workspace_id: {
    type: String,
    required: true,
    index: true
  },
  // Either channel_id (e.g. "chan_general", project_id) OR dm_key ("dm_usr1_usr2")
  channel_id: {
    type: String,
    required: true,
    index: true
  },
  is_dm: {
    type: Boolean,
    default: false
  },
  sender: {
    user_id: { type: String, required: true },
    full_name: { type: String, required: true },
    avatar_url: { type: String, default: '' },
    role: { type: String, default: 'MEMBER' }
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    name: String,
    url: String,
    size: Number,
    mime_type: String
  }],
  reactions: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  reply_to_id: {
    type: String,
    default: null
  },
  is_pinned: {
    type: Boolean,
    default: false
  },
  read_by: [{
    user_id: String,
    read_at: { type: Date, default: Date.now }
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Composite index for fast chronological channel stream queries
ChatMessageSchema.index({ workspace_id: 1, channel_id: 1, created_at: -1 });

const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
module.exports = ChatMessage;
module.exports.ChatMessage = ChatMessage;
