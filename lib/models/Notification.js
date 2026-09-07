const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  notif_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  type: {
    type: String,
    default: 'system'
  },
  ticket_id: {
    type: String,
    default: () => 'TCK-' + Math.floor(100 + Math.random() * 900)
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low', 'normal'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  target_user_id: {
    type: String,
    default: ''
  },
  target_user_name: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    default: ''
  },
  sla_minutes: {
    type: Number,
    default: 60
  },
  resolved_at: {
    type: Date,
    default: null
  },
  resolved_by: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    type: String,
    default: 'Just now'
  },
  read: {
    type: Boolean,
    default: false
  },
  section: {
    type: String,
    default: 'workspaces'
  },
  icon: {
    type: String,
    default: 'bell'
  },
  color: {
    type: String,
    default: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for fast Notification Center badge counts and filtering
NotificationSchema.index({ read: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ read: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

