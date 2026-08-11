const mongoose = require('mongoose');

const CalendarSlotSchema = new mongoose.Schema({
  slot_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `slot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'HELD', 'BOOKED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'],
    default: 'AVAILABLE'
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
    default: 'Sales Team (Africa/Cairo)'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.models.CalendarSlot || mongoose.model('CalendarSlot', CalendarSlotSchema);
