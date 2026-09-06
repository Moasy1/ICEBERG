const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  log_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  user_id: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'User',
    default: null
  },
  user_email: {
    type: String,
    default: 'system'
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARN', 'CRITICAL'],
    default: 'INFO',
    index: true
  },
  entity_type: {
    type: String,
    enum: [
      'USER', 'CLIENT', 'PROJECT', 'TASK', 'INVOICE', 'SYSTEM',
      'WORKSPACE', 'WORKSPACE_PROJECT', 'WORKSPACE_TASK', 'MESSAGE_TOPIC',
      'DOC', 'CHAT_MESSAGE', 'BOOKMARK', 'PLANNER', 'FOCUS_SESSION',
      'OPPORTUNITY', 'AUTH', 'CONTACT', 'LEAD', 'NOTIFICATION', 'ROLE'
    ],
    required: true
  },
  entity_id: {
    type: String,
    required: true
  },
  before: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  after: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  details: {
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

AuditLogSchema.index({ action: 1, created_at: -1 });
AuditLogSchema.index({ entity_type: 1, entity_id: 1 });
AuditLogSchema.index({ user_id: 1, created_at: -1 });
AuditLogSchema.index({ severity: 1, created_at: -1 });

// Optional TTL index toggle via environment variable (disabled by default for long retention)
if (process.env.AUDIT_LOG_TTL_DAYS) {
  const ttlSeconds = parseInt(process.env.AUDIT_LOG_TTL_DAYS, 10) * 86400;
  if (!isNaN(ttlSeconds) && ttlSeconds > 0) {
    AuditLogSchema.index({ created_at: 1 }, { expireAfterSeconds: ttlSeconds });
  }
}

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
