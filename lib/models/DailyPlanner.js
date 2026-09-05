const mongoose = require('mongoose');

const HabitEntrySchema = new mongoose.Schema({
  habit_id: { type: String, required: true },
  title: { type: String, required: true },
  icon: { type: String, default: 'check-circle' },
  color: { type: String, default: '#06b6d4' },
  completed: { type: Boolean, default: false },
  target_count: { type: Number, default: 1 },
  current_count: { type: Number, default: 0 }
}, { _id: false });

const TimeBlockEntrySchema = new mongoose.Schema({
  block_id: {
    type: String,
    default: () => `tblk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
  },
  task_id: { type: String, default: null },
  title: { type: String, required: true },
  start_time: { type: String, required: true }, // "09:00"
  duration_minutes: { type: Number, default: 60 },
  end_time: {
    type: String,
    default: function() {
      if (!this.start_time) return '10:00';
      const [h, m] = this.start_time.split(':').map(Number);
      const totalMinutes = (h || 0) * 60 + (m || 0) + (this.duration_minutes || 60);
      const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
      const endM = String(totalMinutes % 60).padStart(2, '0');
      return `${endH}:${endM}`;
    }
  },
  color: { type: String, default: '#06b6d4' },
  completed: { type: Boolean, default: false }
}, { _id: false });

const DailyPlannerSchema = new mongoose.Schema({
  planner_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => `dp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
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
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  scratchpad: {
    type: String,
    default: ''
  },
  habits: [HabitEntrySchema],
  time_blocks: [TimeBlockEntrySchema],
  reflections: {
    notes: { type: String, default: '' },
    productivity_score: { type: Number, min: 1, max: 5, default: 4 },
    mood: { type: String, enum: ['GREAT', 'GOOD', 'NEUTRAL', 'STRESSED', 'TIRED'], default: 'GREAT' }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Composite unique constraint: One planner per user per day per workspace
DailyPlannerSchema.index({ user_id: 1, workspace_id: 1, date: 1 }, { unique: true });

const DailyPlanner = mongoose.models.DailyPlanner || mongoose.model('DailyPlanner', DailyPlannerSchema);
module.exports = DailyPlanner;
module.exports.DailyPlanner = DailyPlanner;
