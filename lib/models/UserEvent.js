const mongoose = require('mongoose');

const UserEventSchema = new mongoose.Schema({
  event_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  user_id: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'User',
    default: null
  },
  user_email: {
    type: String,
    default: ''
  },
  event_type: {
    type: String,
    required: true,
    index: true
  },
  entity_type: {
    type: String,
    default: ''
  },
  entity_id: {
    type: String,
    default: ''
  },
  session_id: {
    type: String,
    default: ''
  },
  duration_ms: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip_address: {
    type: String,
    default: ''
  },
  user_agent: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

UserEventSchema.index({ user_id: 1, created_at: -1 });
UserEventSchema.index({ event_type: 1, created_at: -1 });
UserEventSchema.index({ session_id: 1, created_at: -1 });

module.exports = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);
