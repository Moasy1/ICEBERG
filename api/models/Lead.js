const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  lead_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  source: {
    type: String,
    required: true,
    default: 'IDEX Landing Page'
  },
  action: {
    type: String,
    default: 'Form Submission'
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  contact_name: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  company: {
    type: String,
    required: [true, 'Please provide a company name'],
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    default: ''
  },
  industry: {
    type: String,
    default: 'Dental',
    trim: true
  },
  sector: {
    type: String,
    default: 'Dental',
    trim: true
  },
  position: {
    type: String,
    trim: true,
    default: ''
  },
  requirements: [{
    type: String
  }],
  interest_tag: {
    type: String,
    default: 'growth_package'
  },
  meeting_date: {
    type: String,
    default: ''
  },
  meeting_time: {
    type: String,
    default: ''
  },
  time_slot: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: '🆕 New Lead'
  },
  owner: {
    type: String,
    default: 'Executive Desk 1'
  },
  notes: {
    type: String,
    default: ''
  },
  utm: {
    source: String,
    medium: String,
    campaign: String,
    content: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
