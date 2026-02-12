const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: true },
    ar: { type: String, required: true }
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    en: { type: String, required: true },
    ar: { type: String, required: true }
  },
  shortDescription: {
    en: { type: String, required: true },
    ar: { type: String, required: true }
  },
  icon: {
    type: String,
    required: true
  },
  iconColor: {
    type: String,
    default: 'cyan'
  },
  features: [{
    title: {
      en: { type: String, required: true },
      ar: { type: String, required: true }
    },
    description: {
      en: String,
      ar: String
    }
  }],
  pricing: {
    basic: {
      title: {
        en: String,
        ar: String
      },
      price: Number,
      features: [{
        en: String,
        ar: String
      }]
    },
    professional: {
      title: {
        en: String,
        ar: String
      },
      price: Number,
      features: [{
        en: String,
        ar: String
      }]
    },
    enterprise: {
      title: {
        en: String,
        ar: String
      },
      price: Number,
      features: [{
        en: String,
        ar: String
      }]
    }
  },
  order: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  seo: {
    title: {
      en: String,
      ar: String
    },
    description: {
      en: String,
      ar: String
    },
    keywords: [String]
  }
}, {
  timestamps: true
});

// Index for faster queries
serviceSchema.index({ slug: 1 });
serviceSchema.index({ featured: 1 });
serviceSchema.index({ status: 1 });
serviceSchema.index({ order: 1 });

module.exports = mongoose.model('Service', serviceSchema);
