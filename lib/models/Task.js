const mongoose = require('mongoose');

const DeliverableVersionSchema = new mongoose.Schema({
  version_number: { type: Number, default: 1 },
  asset_url: { type: String, required: true },
  preview_type: { type: String, enum: ['IMAGE', 'VIDEO', 'FIGMA', 'DOCUMENT', 'URL'], default: 'URL' },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  client_feedback: { type: String, default: '' },
  client_status: {
    type: String,
    enum: ['PENDING_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'],
    default: 'PENDING_REVIEW'
  },
  reviewed_at: { type: Date, default: null }
}, { _id: false });

const TaskSchema = new mongoose.Schema({
  task_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `tsk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountProject',
    required: true,
    index: true
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  assigned_to_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
    default: 'TODO'
  },
  deliverable_versions: [DeliverableVersionSchema],
  revision_rounds_count: {
    type: Number,
    default: 0
  },
  max_free_revisions: {
    type: Number,
    default: 2
  },
  time_tracking: {
    estimated_hours: { type: Number, default: 0 },
    actual_hours: { type: Number, default: 0 },
    labor_cost_accrued: { type: Number, default: 0 }
  },
  due_date: {
    type: Date,
    default: null
  },
  completed_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

TaskSchema.index({ project_id: 1, status: 1 });
TaskSchema.index({ assigned_to_id: 1, status: 1 });
TaskSchema.index({ status: 1, due_date: 1 });

module.exports = mongoose.models.Task || mongoose.model('Task', TaskSchema);
