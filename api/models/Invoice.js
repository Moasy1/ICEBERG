const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unit_price: { type: Number, required: true },
  total: { type: Number, required: true }
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
  invoice_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  },
  invoice_number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountProject',
    default: null
  },
  items: [InvoiceItemSchema],
  currency: {
    type: String,
    enum: ['USD', 'EGP'],
    default: 'USD'
  },
  fx_rate_to_egp: {
    type: Number,
    default: 1.0
  },
  financial_breakdown: {
    subtotal: { type: Number, required: true },
    vat_rate_percent: { type: Number, default: 14 },
    vat_amount: { type: Number, default: 0 },
    withholding_tax_percent: { type: Number, default: 0 },
    withholding_tax_amount: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
    net_payable_amount: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'],
    default: 'DRAFT'
  },
  dates: {
    issue_date: { type: Date, default: Date.now },
    due_date: { type: Date, required: true },
    paid_date: { type: Date, default: null }
  },
  payment_details: {
    method: {
      type: String,
      enum: ['INSTAPAY', 'VODAFONE_CASH', 'BANK_TRANSFER_CIB', 'BANK_TRANSFER_NBE', 'STRIPE', 'CREDIT_CARD', 'CASH', 'OTHER'],
      default: 'INSTAPAY'
    },
    transaction_reference: { type: String, default: '' },
    instapay_handle: { type: String, default: 'iceberg@instapay' },
    vodafone_cash_number: { type: String, default: '+201000000000' },
    bank_iban: { type: String, default: '' }
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

InvoiceSchema.index({ client_id: 1, status: 1 });
InvoiceSchema.index({ status: 1, 'dates.due_date': 1 });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
