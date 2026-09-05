const mongoose = require('mongoose');

const WorkspaceProjectSchema = new mongoose.Schema({
  project_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `wp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  },
  workspace_id: {
    type: String,
    required: true,
    index: true
  },
  client_id: {
    type: String,
    index: true,
    default: null // Linked CRM/IAMS client if client project
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    trim: true,
    default: function() {
      return (this.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6);
    }
  },
  description: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#06b6d4' // Iceberg Cyan
  },
  icon: {
    type: String,
    default: 'folder'
  },
  is_private: {
    type: Boolean,
    default: false
  },
  allowed_members: [{
    type: String // user_id
  }],
  // Modular Tool Toggles per Project List
  tools: {
    tasks: { type: Boolean, default: true },
    kanban: { type: Boolean, default: true },
    calendar: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    docs: { type: Boolean, default: true },
    files: { type: Boolean, default: true },
    bookmarks: { type: Boolean, default: true },
    chat: { type: Boolean, default: true }
  },
  sections: [{
    section_id: {
      type: String,
      default: () => `sec_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
    },
    name: { type: String, required: true },
    position_rank: { type: String, default: '0|h00000:' },
    color: { type: String, default: '#64748b' },
    is_collapsed: { type: Boolean, default: false }
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED', 'COMPLETED'],
    default: 'ACTIVE'
  },
  created_by: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Composite index for workspace + slug
WorkspaceProjectSchema.index({ workspace_id: 1, slug: 1 }, { unique: true });

const WorkspaceProject = mongoose.models.WorkspaceProject || mongoose.model('WorkspaceProject', WorkspaceProjectSchema);
module.exports = WorkspaceProject;
module.exports.WorkspaceProject = WorkspaceProject;
