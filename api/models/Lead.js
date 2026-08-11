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
    enum: ['idex_audit', 'idex_meeting', 'idex_lead_form', 'idex_qr'],
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [50, 'Phone number cannot exceed 50 characters']
  },
  company: {
    type: String,
    required: [true, 'Please provide a company name'],
    trim: true,
    maxlength: [250, 'Company name cannot exceed 250 characters']
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
    required: [true, 'Please select or provide an industry'],
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
    enum: ['growth_package', 'audit_only', 'multiple_services', 'other'],
    default: 'other'
  },
  meeting_time: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'SCHEDULED', 'PROPOSAL', 'CLOSED', 'LOST'],
    default: 'NEW'
  },
  owner: {
    type: String,
    default: 'Sales Team (Round-Robin)'
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
