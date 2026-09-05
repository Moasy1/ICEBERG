const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
  workspace_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `ws_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },
  logo_url: {
    type: String,
    default: ''
  },
  owner_id: {
    type: String,
    index: true,
    default: function() { return this.owner_user_id || 'usr_demo_admin'; }
  },
  owner_user_id: {
    type: String,
    index: true,
    default: function() { return this.owner_id || 'usr_demo_admin'; }
  },
  settings: {
    default_currency: {
      type: String,
      enum: ['EGP', 'USD', 'EUR', 'SAR', 'AED'],
      default: 'EGP'
    },
    timezone: {
      type: String,
      default: 'Africa/Cairo'
    },
    work_days: {
      type: [Number],
      default: [0, 1, 2, 3, 4] // Sun - Thu (Egypt working week)
    },
    daily_working_hours: {
      type: Number,
      default: 8
    }
  },
  members: [{
    user_id: { type: String, required: true },
    email: { type: String, required: true },
    full_name: { type: String, default: '' },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'MEMBER', 'GUEST', 'CLIENT_VIEWER'],
      default: 'MEMBER'
    },
    allowed_project_ids: [{ type: String }],
    assigned_projects: [{ type: String }],
    joined_at: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true }
  }],
  plan: {
    type: String,
    enum: ['FREE', 'PRO', 'ENTERPRISE'],
    default: 'ENTERPRISE'
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);
module.exports = Workspace;
module.exports.Workspace = Workspace;
