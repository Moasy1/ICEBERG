const mongoose = require('mongoose');

const ChangeRequestSchema = new mongoose.Schema({
  cr_id: { type: String, default: () => `cr_${Date.now()}` },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  additional_fee: { type: Number, default: 0 },
  currency: { type: String, enum: ['USD', 'EGP'], default: 'USD' },
  approved_by_client: { type: Boolean, default: false },
  approved_at: { type: Date, default: null }
}, { _id: false, timestamps: true });

const AccountProjectSchema = new mongoose.Schema({
  project_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `prj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  service_category: {
    type: String,
    enum: ['WEB_DEVELOPMENT', 'SEO', 'SOCIAL_MEDIA', 'PERFORMANCE_MARKETING', 'BRANDING', 'CONTENT_PRODUCTION'],
    required: true
  },
  lead_specialist_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  budget: {
    currency: { type: String, enum: ['USD', 'EGP'], default: 'USD' },
    allocated_amount: { type: Number, default: 0 },
    consumed_amount: { type: Number, default: 0 },
    estimated_labor_cost: { type: Number, default: 0 }
  },
  links: {
    repository_url: { type: String, default: '' },
    staging_url: { type: String, default: '' },
    production_url: { type: String, default: '' },
    figma_url: { type: String, default: '' },
    drive_folder: { type: String, default: '' }
  },
  timeline: {
    kickoff_date: { type: Date, default: Date.now },
    deadline: { type: Date, default: null },
    completed_at: { type: Date, default: null }
  },
  change_requests: [ChangeRequestSchema],
  status: {
    type: String,
    enum: ['PLANNING', 'IN_DEVELOPMENT', 'IN_REVIEW', 'ACTIVE_RETAINER', 'COMPLETED', 'ON_HOLD'],
    default: 'PLANNING'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

AccountProjectSchema.index({ lead_specialist_id: 1 });
AccountProjectSchema.index({ status: 1 });
AccountProjectSchema.index({ service_category: 1 });

module.exports = mongoose.models.AccountProject || mongoose.model('AccountProject', AccountProjectSchema);
