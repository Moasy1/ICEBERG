const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: ['web-development', 'social-media', 'seo', 'branding', 'other'],
    required: true
  },
  client: {
    type: String,
    required: true
  },
  technologies: [{
    type: String
  }],
  images: [{
    url: String,
    alt: {
      en: String,
      ar: String
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  featured: {
    type: Boolean,
    default: false
  },
  completedDate: {
    type: Date,
    required: true
  },
  clientLogo: String,
  projectUrl: String,
  caseStudy: {
    en: String,
    ar: String
  },
  results: {
    roiIncrease: Number,
    trafficIncrease: Number,
    conversionRate: Number,
    customMetrics: [{
      name: {
        en: String,
        ar: String
      },
      value: String,
      unit: String
    }]
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
projectSchema.index({ slug: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ featured: 1 });
projectSchema.index({ status: 1 });

module.exports = mongoose.model('Project', projectSchema);
