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
  favicon: {
    type: String,
    default: ''
  },
  domain: {
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
  created_by: {
    user_id: String,
    full_name: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

ProjectBookmarkSchema.index({ workspace_id: 1, project_id: 1, is_pinned: -1, created_at: -1 });

const ProjectBookmark = mongoose.models.ProjectBookmark || mongoose.model('ProjectBookmark', ProjectBookmarkSchema);
module.exports = ProjectBookmark;
module.exports.ProjectBookmark = ProjectBookmark;
