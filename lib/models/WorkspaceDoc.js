const mongoose = require('mongoose');

const DocVersionSchema = new mongoose.Schema({
  version_number: { type: Number, required: true },
  title: {
    type: String,
    default: 'Document Snapshot'
  },
  content_html: { type: String, required: true },
  content_json: { type: mongoose.Schema.Types.Mixed, default: null },
  saved_by: { type: String, default: 'Team Member' },
  updated_by: {
    user_id: String,
    full_name: String
  },
  created_at: { type: Date, default: Date.now }
}, { _id: false });

const WorkspaceDocSchema = new mongoose.Schema({
  doc_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `doc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
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
    trim: true,
    default: 'Untitled Document'
  },
  icon: {
    type: String,
    default: 'file-text'
  },
  banner_url: {
    type: String,
    default: ''
  },
  parent_folder_id: {
    type: String,
    default: null
  },
  content_html: {
    type: String,
    default: '<p></p>'
  },
  content_json: {
    type: mongoose.Schema.Types.Mixed,
    default: null // Tiptap ProseMirror document representation
  },
  current_version: {
    type: Number,
    default: 1
  },
  version_history: [DocVersionSchema],
  is_locked: {
    type: Boolean,
    default: false
  },
  is_pinned: {
    type: Boolean,
    default: false
  },
  public_share_token: {
    type: String,
    default: null,
    index: true
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
  doc_type: {
    type: String,
    enum: ['WIKI', 'SPEC', 'DELIVERABLE', 'TASK_ATTACHMENT'],
    default: 'WIKI',
    index: true
  },
  file_url: {
    type: String,
    default: ''
  },
  file_size: {
    type: String,
    default: ''
  },
  file_type: {
    type: String,
    default: ''
  },
  is_deliverable: {
    type: Boolean,
    default: false,
    index: true
  },
  created_by: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ user_id: 'usr_demo_admin', full_name: 'Team Member' })
  },
  last_modified_by: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ user_id: '', full_name: '' })
  },
  last_edited_by: {
    type: String,
    default: 'Team Member'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Composite index
WorkspaceDocSchema.index({ workspace_id: 1, project_id: 1, updated_at: -1 });
WorkspaceDocSchema.index({ workspace_id: 1, task_id: 1 });

const WorkspaceDoc = mongoose.models.WorkspaceDoc || mongoose.model('WorkspaceDoc', WorkspaceDocSchema);
module.exports = WorkspaceDoc;
module.exports.WorkspaceDoc = WorkspaceDoc;
