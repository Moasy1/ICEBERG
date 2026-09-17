const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { normalizeRole } = require('../middleware/roleMatrix');

const UserSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  username: {
    type: String,
    unique: true,
    sparse: true,  // allows null — not every user needs a username
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Staff email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: [
      // New RBAC roles (from PostgreSQL spec)
      'CEO', 'CreativeDirector', 'MarketingManager', 'ClientGuest',
      // Legacy roles (backward compatibility)
      'SUPER_ADMIN', 'ACCOUNT_MANAGER', 'SPECIALIST', 'CLIENT_VIEWER'
    ],
    default: 'MarketingManager'
  },
  department: {
    type: String,
    enum: ['WEB_DEV', 'SEO', 'SOCIAL_MEDIA', 'PERFORMANCE_MARKETING', 'BRANDING', 'VIDEO_PRODUCTION', 'OPERATIONS'],
    default: 'OPERATIONS'
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  cost_rates: {
    hourly_cost: { type: Number, default: 0 },
    currency: { type: String, enum: ['USD', 'EGP'], default: 'EGP' }
  },
  capacity: {
    weekly_hours: { type: Number, default: 40 },
    active_load_hours: { type: Number, default: 0 }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  avatar_url: {
    type: String,
    default: ''
  },
  last_login: {
    type: Date,
    default: null
  },
  must_change_password: {
    type: Boolean,
    default: true
  },
  assigned_project_id: {
    type: String,
    default: null,
    index: true
  },
  assigned_client_id: {
    type: String,
    default: null,
    index: true
  },
  onboarding: {
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED'
    },
    completed_steps: {
      type: [String],
      default: []
    },
    buddy_name: {
      type: String,
      default: ''
    },
    start_date: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: ''
    }
  },
  okrs: [{
    okr_id: {
      type: String,
      default: () => `okr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    },
    quarter: {
      type: String,
      default: 'Q1-2026'
    },
    objective: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['DELIVERY', 'GROWTH', 'QUALITY', 'LEADERSHIP', 'INNOVATION'],
      default: 'DELIVERY'
    },
    key_results: [{
      kr_id: { type: String, default: () => `kr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` },
      text: { type: String, required: true },
      current: { type: Number, default: 0 },
      target: { type: Number, default: 100 },
      unit: { type: String, default: '%' }
    }],
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['ON_TRACK', 'AT_RISK', 'BEHIND', 'ACHIEVED'],
      default: 'ON_TRACK'
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  performance_reviews: [{
    review_id: {
      type: String,
      default: () => `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    },
    reviewer_name: {
      type: String,
      default: 'CEO'
    },
    date: {
      type: Date,
      default: Date.now
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    notes: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'Quarterly Appraisal'
    }
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual: Always returns the canonical RBAC role name
UserSchema.virtual('normalizedRole').get(function() {
  return normalizeRole(this.role);
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ is_active: 1 });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
