const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    en: { type: String, required: true },
    ar: { type: String, required: true }
  },
  type: {
    type: String,
    enum: ['text', 'html', 'json'],
    default: 'text'
  },
  category: {
    type: String,
    enum: ['navigation', 'hero', 'services', 'about', 'contact', 'footer', 'general'],
    required: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  modifiedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

// Index for faster queries
contentSchema.index({ key: 1 });
contentSchema.index({ category: 1 });

module.exports = mongoose.model('Content', contentSchema);
