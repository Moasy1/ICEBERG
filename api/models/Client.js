const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  client_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `cli_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  company_name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    index: true
  },
  contact_person: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    whatsapp_number: { type: String, trim: true, default: '' },
    position: { type: String, trim: true, default: '' }
  },
  corporate_tax_info: {
    tax_id_number: { type: String, default: '', trim: true }, // البطاقة الضريبية
    commercial_register: { type: String, default: '', trim: true }, // السجل التجاري
    billing_address: { type: String, default: '', trim: true },
    vat_exempt: { type: Boolean, default: false }
  },
  industry: {
    type: String,
    trim: true,
    default: 'General Business'
  },
  website_url: {
    type: String,
    trim: true,
    default: ''
  },
  account_manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['PROSPECT', 'ONBOARDING', 'ACTIVE_RETAINER', 'PROJECT_BASED', 'PAUSED', 'CHURNED'],
    default: 'ONBOARDING'
  },
  financials: {
    currency: {
      type: String,
      enum: ['USD', 'EGP'],
      default: 'USD'
    },
    monthly_retainer: {
      type: Number,
      default: 0
    },
    payment_terms_days: {
      type: Number,
      default: 15
    },
    total_lifetime_value: {
      type: Number,
      default: 0
    },
    billing_cycle: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'MILESTONE_BASED'],
      default: 'MONTHLY'
    }
  },
  retainer_quotas: {
    monthly_reels: { allocated: { type: Number, default: 0 }, consumed: { type: Number, default: 0 } },
    monthly_posts: { allocated: { type: Number, default: 0 }, consumed: { type: Number, default: 0 } },
    monthly_dev_hours: { allocated: { type: Number, default: 0 }, consumed: { type: Number, default: 0 } },
    monthly_seo_articles: { allocated: { type: Number, default: 0 }, consumed: { type: Number, default: 0 } },
    monthly_ad_spend_management: { allocated: { type: Number, default: 0 }, consumed: { type: Number, default: 0 } }
  },
  contract_period: {
    start_date: { type: Date, default: null },
    renewal_date: { type: Date, default: null },
    auto_renew: { type: Boolean, default: true }
  },
  originating_lead_id: {
    type: String,
    ref: 'Lead',
    default: null
  },
  originating_calendar_slot: {
    type: String,
    ref: 'CalendarSlot',
    default: null
  },
  portal_access: {
    enabled: { type: Boolean, default: true },
    active_magic_token: { type: String, default: null },
    token_expires_at: { type: Date, default: null }
  },
  meeting_minutes: [{
    meeting_id: { type: String, default: () => `mtg_${Date.now()}` },
    meeting_type: { type: String, enum: ['STRATEGY', 'WEEKLY_SYNC', 'DELIVERABLE_REVIEW', 'EMERGENCY'], default: 'WEEKLY_SYNC' },
    date: { type: Date, default: Date.now },
    attendees: [String],
    summary: String,
    action_items: [{
      task_title: String,
      assigned_to: String,
      due_date: Date,
      is_done: { type: Boolean, default: false }
    }]
  }],
  notes: [{
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    author_name: String,
    text: String,
    created_at: { type: Date, default: Date.now }
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

ClientSchema.index({ status: 1 });
ClientSchema.index({ account_manager_id: 1 });
ClientSchema.index({ 'contact_person.email': 1 });
ClientSchema.index({ 'corporate_tax_info.tax_id_number': 1 });
ClientSchema.index({ status: 1, created_at: -1 });

module.exports = mongoose.models.Client || mongoose.model('Client', ClientSchema);
