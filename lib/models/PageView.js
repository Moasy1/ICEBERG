const mongoose = require('mongoose');

/**
 * PageView — persisted analytics event stored in MongoDB.
 * Each page visit fires one document.
 */
const PageViewSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  label: {
    type: String,
    trim: true,
    maxlength: 150,
    default: ''
  },
  // Classified traffic source: organic | paid | social | email | referral | direct
  source: {
    type: String,
    trim: true,
    maxlength: 50,
    default: 'direct',
    index: true
  },
  referrer: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  utm_source: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  utm_medium: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  utm_campaign: {
    type: String,
    trim: true,
    maxlength: 150,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for per-page time-series queries
PageViewSchema.index({ page: 1, timestamp: -1 });
// Compound index for source + time queries
PageViewSchema.index({ source: 1, timestamp: -1 });

module.exports = mongoose.models.PageView || mongoose.model('PageView', PageViewSchema);
