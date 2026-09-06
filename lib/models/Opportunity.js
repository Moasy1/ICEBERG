const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  activity_id: {
    type: String,
    default: () => `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  type: {
    type: String,
    enum: ['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE'],
    default: 'NOTE'
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  due_date: {
    type: Date,
    default: null
  },
  completed_at: {
    type: Date,
    default: null
  },
  created_by: {
    type: String,
    default: 'system'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const OpportunitySchema = new mongoose.Schema({
  opportunity_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `opp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  name: {
    type: String,
    required: [true, 'Opportunity name is required'],
    trim: true,
    index: true
  },
  source: {
    type: String,
    enum: ['INBOUND_LEAD', 'REFERRAL', 'COLD_OUTREACH', 'INTERNAL_UPSELL', 'EXISTING_CLIENT', 'OTHER'],
    default: 'INBOUND_LEAD'
  },
  source_lead_id: {
    type: String,
    default: null
  },
  source_client_id: {
    type: String,
    default: null
  },
  industry: {
    type: String,
    trim: true,
    default: 'General'
  },
  estimated_value: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    enum: ['USD', 'EGP'],
    default: 'USD'
  },
  probability_percent: {
    type: Number,
    default: 20,
    min: 0,
    max: 100
  },
  weighted_value: {
    type: Number,
    default: 0
  },
  stage: {
    type: String,
    enum: ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'],
    default: 'NEW',
    index: true
  },
  expected_close_date: {
    type: Date,
    default: null
  },
  actual_close_date: {
    type: Date,
    default: null
  },
  lost_reason: {
    type: String,
    default: ''
  },
  owner_id: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'User',
    default: null
  },
  owner_email: {
    type: String,
    default: ''
  },
  contact_person: {
    name: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    position: { type: String, default: '', trim: true },
    company: { type: String, default: '', trim: true }
  },
  notes: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  activities: [ActivitySchema],
  next_action: {
    summary: { type: String, default: '' },
    due_date: { type: Date, default: null }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-calculate weighted_value before saving
OpportunitySchema.pre('save', function(next) {
  if (typeof this.estimated_value === 'number' && typeof this.probability_percent === 'number') {
    this.weighted_value = Math.round((this.estimated_value * this.probability_percent) / 100);
  }
  next();
});

OpportunitySchema.index({ stage: 1, expected_close_date: 1 });
OpportunitySchema.index({ owner_id: 1, stage: 1 });
OpportunitySchema.index({ source_lead_id: 1 });
OpportunitySchema.index({ source_client_id: 1 });

module.exports = mongoose.models.Opportunity || mongoose.model('Opportunity', OpportunitySchema);
