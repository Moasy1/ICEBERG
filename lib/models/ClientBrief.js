const mongoose = require('mongoose');

const ClientBriefSchema = new mongoose.Schema({
  brief_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `brf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  project_id: {
    type: String,
    required: true,
    index: true
  },
  client_id: {
    type: String,
    required: true,
    index: true
  },
  company_name: {
    type: String,
    required: true,
    trim: true
  },
  // Section 1: Brand & Core Identity
  brand_overview: {
    brand_story: { type: String, default: '' },
    mission_vision: { type: String, default: '' },
    core_values: { type: [String], default: [] },
    value_proposition: { type: String, default: '' },
    industry_niche: { type: String, default: '' }
  },
  // Section 2: Target Audience & Customer Profile
  target_audience: {
    primary_persona: { type: String, default: '' },
    demographics: { type: String, default: '' },
    pain_points: { type: [String], default: [] },
    desired_action: { type: String, default: '' }
  },
  // Section 3: Project Scope, KPIs & Requirements
  scope_and_objectives: {
    primary_goal: {
      type: String,
      enum: ['LEAD_GENERATION', 'BRAND_AWARENESS', 'ECOMMERCE_SALES', 'REBRANDING', 'CONVERSION_OPTIMIZATION', 'CUSTOM'],
      default: 'LEAD_GENERATION'
    },
    target_kpis: { type: String, default: '' },
    key_features_required: { type: [String], default: [] },
    launch_deadline_expectation: { type: Date, default: null }
  },
  // Section 4: Design, Aesthetics & Creative Tone
  creative_preferences: {
    visual_style: {
      type: String,
      enum: ['MINIMAL_LUXURY', 'TECH_FUTURISTIC', 'WARM_EDITORIAL', 'BOLD_HIGH_ENERGY', 'CLEAN_CORPORATE'],
      default: 'MINIMAL_LUXURY'
    },
    brand_colors: { type: [String], default: ['#06b6d4', '#0f172a'] },
    typography_preference: { type: String, default: '' },
    competitor_benchmarks: [{
      name: { type: String, default: '' },
      url: { type: String, default: '' },
      notes: { type: String, default: '' }
    }],
    sites_they_dislike: [{
      url: { type: String, default: '' },
      reason: { type: String, default: '' }
    }],
    moodboard_links: { type: [String], default: [] }
  },
  // Section 5: Brand Assets & Technical Access
  assets_and_access: {
    logo_files: [{
      name: String,
      url: String,
      type: { type: String, default: 'vector' }
    }],
    brand_guidelines_url: { type: String, default: '' },
    drive_folder_url: { type: String, default: '' },
    domain_registrar: { type: String, default: '' },
    existing_website_url: { type: String, default: '' },
    social_handles: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    notes: { type: String, default: '' }
  },
  // Brief Lifecycle & Verification
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_REQUESTED'],
    default: 'DRAFT',
    index: true
  },
  completion_percentage: {
    type: Number,
    default: 0
  },
  submitted_at: {
    type: Date,
    default: null
  },
  reviewed_by: {
    user_id: { type: String, default: null },
    full_name: { type: String, default: null },
    reviewed_at: { type: Date, default: null },
    feedback: { type: String, default: '' }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Calculate completion percentage before saving
ClientBriefSchema.pre('save', function(next) {
  let score = 0;
  if (this.brand_overview?.brand_story) score += 15;
  if (this.brand_overview?.value_proposition) score += 15;
  if (this.target_audience?.primary_persona) score += 15;
  if (this.scope_and_objectives?.target_kpis) score += 15;
  if (this.creative_preferences?.visual_style) score += 15;
  if (this.creative_preferences?.competitor_benchmarks?.length > 0) score += 10;
  if (this.assets_and_access?.brand_guidelines_url || this.assets_and_access?.logo_files?.length > 0 || this.assets_and_access?.existing_website_url) score += 15;

  this.completion_percentage = Math.min(100, score);
  next();
});

ClientBriefSchema.index({ project_id: 1, client_id: 1 });

module.exports = mongoose.models.ClientBrief || mongoose.model('ClientBrief', ClientBriefSchema);
