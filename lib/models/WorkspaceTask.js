const mongoose = require('mongoose');

const SubtaskSchema = new mongoose.Schema({
  subtask_id: {
    type: String,
    default: () => `sub_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
  },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  assignee_id: { type: String, default: null },
  due_date: { type: Date, default: null },
  position_rank: { type: String, default: '0|h00000:' }
}, { _id: false });

const TimeLogSchema = new mongoose.Schema({
  log_id: {
    type: String,
    default: () => `tlog_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
  },
  user_id: { type: String, required: true },
  user_name: { type: String, default: '' },
  minutes: { type: Number, required: true },
  note: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  is_billable: { type: Boolean, default: true }
}, { _id: false });

const TaskCommentSchema = new mongoose.Schema({
  comment_id: {
    type: String,
    default: () => `cmt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
  },
  author_id: { type: String, required: true },
  author_name: { type: String, default: '' },
  author_avatar: { type: String, default: '' },
  text: { type: String, required: true },
  attachments: [{
    name: String,
    url: String,
    size: Number,
    mime_type: String
  }],
  created_at: { type: Date, default: Date.now }
}, { _id: false });

const WorkspaceTaskSchema = new mongoose.Schema({
  task_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `tsk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
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
  section_id: {
    type: String,
    index: true,
    default: null
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
  description_json: {
    type: mongoose.Schema.Types.Mixed,
    default: null // Tiptap/ProseMirror structured representation
  },
  status: {
    type: String,
    enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'IN_REVIEW', 'DONE', 'COMPLETED', 'CANCELLED'],
    default: 'TODO',
    index: true
  },
  priority: {
    type: String,
    enum: ['URGENT', 'HIGH', 'MEDIUM', 'NORMAL', 'LOW', 'NONE'],
    default: 'MEDIUM',
    index: true
  },
  position_rank: {
    type: String,
    default: function() { return this.position || '0|h00000:'; },
    index: true // LexoRank for O(1) reordering
  },
  position: {
    type: String,
    default: function() { return this.position_rank || '0|h00000:'; },
    index: true
  },
  assignees: [{
    user_id: { type: String, required: true },
    full_name: { type: String, default: '' },
    avatar_url: { type: String, default: '' }
  }],
  due_date: {
    type: Date,
    default: null,
    index: true
  },
  start_date: {
    type: Date,
    default: null
  },
  // Time-blocking attributes for Personal Daily Planner
  scheduled_date: {
    type: String, // YYYY-MM-DD
    default: null,
    index: true
  },
  start_time: {
    type: String, // e.g. "09:30"
    default: null
  },
  duration_minutes: {
    type: Number, // e.g. 60
    default: 0
  },
  // Subtasks checklist
  subtasks: [SubtaskSchema],
  // Time tracking
  estimated_minutes: {
    type: Number,
    default: 0
  },
  logged_minutes: {
    type: Number,
    default: 0
  },
  time_logs: [TimeLogSchema],
  // Comments and discussion
  comments: [TaskCommentSchema],
  // Tags
  tags: [{
    type: String,
    trim: true
  }],
  // Recurring rule
  recurring: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'], default: 'WEEKLY' },
    interval: { type: Number, default: 1 },
    days_of_week: [{ type: Number }], // 0 = Sun, 1 = Mon ...
    end_date: { type: Date, default: null }
  },
  created_by: {
    type: String,
    required: true
  },
  completed_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Composite index for fast board & daily planner queries
WorkspaceTaskSchema.index({ workspace_id: 1, project_id: 1, status: 1, position_rank: 1 });
WorkspaceTaskSchema.index({ workspace_id: 1, scheduled_date: 1, start_time: 1 });

const WorkspaceTask = mongoose.models.WorkspaceTask || mongoose.model('WorkspaceTask', WorkspaceTaskSchema);
module.exports = WorkspaceTask;
module.exports.WorkspaceTask = WorkspaceTask;
