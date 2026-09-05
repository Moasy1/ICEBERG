const mongoose = require('mongoose');

const CalendarSlotSchema = new mongoose.Schema({
  slot_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `slot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  date: {
    type: String,
    default: ''
  },
  time: {
    type: String,
    default: ''
  },
  start_time: {
    type: Date,
    default: Date.now
  },
  end_time: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'AVAILABLE'
  },
  company: {
    type: String,
    default: ''
  },
  contact_name: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  held_until: {
    type: Date,
    default: null
  },
  held_by_session: {
    type: String,
    default: null
  },
  lead_id: {
    type: String,
    default: null
  },
  lead_email: {
    type: String,
    default: null
  },
  owner: {
    type: String,
    default: 'Executive Desk 1'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for fast meeting slot and booking lookups
CalendarSlotSchema.index({ status: 1 });
CalendarSlotSchema.index({ date: 1 });
CalendarSlotSchema.index({ start_time: 1 });
CalendarSlotSchema.index({ lead_id: 1 });
CalendarSlotSchema.index({ owner: 1 });
CalendarSlotSchema.index({ status: 1, date: 1 });
CalendarSlotSchema.index({ status: 1, start_time: 1 });
CalendarSlotSchema.index({ date: 1, time: 1 });

module.exports = mongoose.models.CalendarSlot || mongoose.model('CalendarSlot', CalendarSlotSchema);

