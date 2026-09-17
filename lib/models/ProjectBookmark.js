const mongoose = require('mongoose');

const ProjectBookmarkSchema = new mongoose.Schema({
  bookmark_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `bmk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
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
  url: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  image_url: {
    type: String,
    default: ''
  },
  favicon: {
    type: String,
    default: ''
  },
  favicon_url: {
    type: String,
    default: ''
  },
  domain: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  is_pinned: {
    type: Boolean,
    default: false
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
  source: {
    type: String,
    enum: ['MANUAL', 'TASK_ATTACHMENT', 'TASK_COMMENT', 'SUBTASK_LINK'],
    default: 'MANUAL',
    index: true
  },
  created_by: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ user_id: 'usr_demo_admin', full_name: 'Team Member' })
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

ProjectBookmarkSchema.index({ workspace_id: 1, project_id: 1, is_pinned: -1, created_at: -1 });
ProjectBookmarkSchema.index({ workspace_id: 1, task_id: 1 });

const ProjectBookmark = mongoose.models.ProjectBookmark || mongoose.model('ProjectBookmark', ProjectBookmarkSchema);
module.exports = ProjectBookmark;
module.exports.ProjectBookmark = ProjectBookmark;
