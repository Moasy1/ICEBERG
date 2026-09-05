const mongoose = require('mongoose');

const FocusSessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `foc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  workspace_id: {
    type: String,
    required: true,
    index: true
  },
  task_id: {
    type: String,
    default: null
  },
  duration_minutes: {
    type: Number,
    required: true,
    default: 25
  },
  mode: {
    type: String,
    enum: ['POMODORO', 'SHORT_BREAK', 'LONG_BREAK', 'DEEP_WORK', 'CUSTOM'],
    default: 'POMODORO'
  },
  ambient_sound: {
    type: String,
    enum: ['NONE', 'OFF', 'RAIN', 'ALPHA', 'ALPHA_WAVES', 'CAFE', 'WHITE_NOISE', 'BROWN_NOISE'],
    default: 'OFF'
  },
  notes: {
    type: String,
    default: ''
  },
  completed: {
    type: Boolean,
    default: true
  },
  started_at: {
    type: Date,
    default: Date.now
  },
  ended_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

FocusSessionSchema.index({ user_id: 1, workspace_id: 1, created_at: -1 });

const FocusSession = mongoose.models.FocusSession || mongoose.model('FocusSession', FocusSessionSchema);
module.exports = FocusSession;
module.exports.FocusSession = FocusSession;
