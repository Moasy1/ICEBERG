const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  log_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
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
  entity_type: {
    type: String,
    enum: ['USER', 'CLIENT', 'PROJECT', 'TASK', 'INVOICE', 'SYSTEM'],
    required: true
  },
  entity_id: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip_address: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: 'created_at' }
});

AuditLogSchema.index({ action: 1, created_at: -1 });
AuditLogSchema.index({ entity_type: 1, entity_id: 1 });
AuditLogSchema.index({ user_id: 1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
