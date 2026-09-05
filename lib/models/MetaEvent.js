const mongoose = require('mongoose');

/**
 * MetaEvent — Persisted tracking event document for Meta CAPI & Pixel deduplication.
 * Stores every client & server event, its unique event_id, status, cookies (_fbp/_fbc),
 * user metadata, and Graph API delivery response.
 */
const MetaEventSchema = new mongoose.Schema({
  event_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  event_name: {
    type: String,
    required: true,
    trim: true
  },
  meta_capi_status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  fbp: {
    type: String,
    trim: true,
    default: null
  },
  fbc: {
    type: String,
    trim: true,
    default: null
  },
  event_source_url: {
    type: String,
    trim: true,
    default: ''
  },
  user_data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  custom_data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  test_event_code: {
    type: String,
    trim: true,
    default: null
  },
  meta_response: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  error_message: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for fast idempotency lookup and status filtering
MetaEventSchema.index({ event_id: 1, meta_capi_status: 1 });
MetaEventSchema.index({ event_name: 1, created_at: -1 });

module.exports = mongoose.models.MetaEvent || mongoose.model('MetaEvent', MetaEventSchema);
