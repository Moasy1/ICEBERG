const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Invoice = require('../../models/Invoice');
const Client = require('../../models/Client');
const Notification = require('../../models/Notification');
const AuditLog = require('../../models/AuditLog');
const { verifyToken, authorizeRoles } = require('../../middleware/auth');

// Append-only fallback disk logger for financial ledger mutations
const logFinancialActionToDisk = (entry) => {
  try {
    const backupFile = path.join(__dirname, '../../iams_audit_backup.jsonl');
    const logLine = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...entry
    }) + '\n';
    fs.appendFileSync(backupFile, logLine, 'utf8');
  } catch (err) {
    console.error('[IAMS Financial Disk Backup Error]:', err);
  }
};

/**
 * GET /api/iams/invoices
 * Invoices directory with financial totals
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { client_id, status, currency } = req.query;
    const filter = {};
    if (client_id) filter.client_id = client_id;
    if (status) filter.status = status;
    if (currency) filter.currency = currency;

    const invoices = await Invoice.find(filter)
      .populate('client_id', 'company_name contact_person financials corporate_tax_info')
      .populate('project_id', 'title service_category')
      .sort({ 'dates.issue_date': -1 });

    // Calculate aggregated totals in USD and EGP
    let totalInvoicedUSD = 0;
    let totalInvoicedEGP = 0;
    let totalCollectedUSD = 0;
    let totalCollectedEGP = 0;
    let totalOverdueUSD = 0;
    let totalOverdueEGP = 0;

    invoices.forEach(inv => {
      const amount = inv.financial_breakdown?.net_payable_amount || inv.total_amount || 0;
      const isUSD = inv.currency === 'USD';

      if (isUSD) {
        totalInvoicedUSD += amount;
        if (inv.status === 'PAID') totalCollectedUSD += amount;
        if (inv.status === 'OVERDUE') totalOverdueUSD += amount;
      } else {
        totalInvoicedEGP += amount;
        if (inv.status === 'PAID') totalCollectedEGP += amount;
        if (inv.status === 'OVERDUE') totalOverdueEGP += amount;
      }
    });

    res.json({
      success: true,
      summary: {
        total_invoices: invoices.length,
        invoiced: { USD: totalInvoicedUSD, EGP: totalInvoicedEGP },
        collected: { USD: totalCollectedUSD, EGP: totalCollectedEGP },
        overdue: { USD: totalOverdueUSD, EGP: totalOverdueEGP }
      },
      invoices
    });
  } catch (err) {
    console.error('[IAMS Invoices GET Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve invoices.' });
  }
});

/**
 * POST /api/iams/invoices
 * Generate new invoice with automated Egyptian VAT (14%) and WHT calculations
 */
router.post('/', verifyToken, authorizeRoles('SUPER_ADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  try {
    const {
      client_id,
      project_id,
      items,
      currency,
      fx_rate_to_egp,
      vat_rate_percent = 14,
      withholding_tax_percent = 0,
      discount_amount = 0,
      due_days = 15,
      payment_method,
      notes
    } = req.body;

    if (!client_id || !items || !items.length) {
      return res.status(400).json({ success: false, error: 'Client ID and at least one line item are required.' });
    }

    const client = await Client.findById(client_id);
    if (!client) return res.status(404).json({ success: false, error: 'Client not found.' });

    // Calculate item totals & subtotal
    let subtotal = 0;
    const computedItems = items.map(item => {
      const quantity = Number(item.quantity) || 1;
      const unit_price = Number(item.unit_price) || 0;
      const total = quantity * unit_price;
      subtotal += total;
      return { description: item.description, quantity, unit_price, total };
    });

    // Tax breakdown
    const applyVat = !client.corporate_tax_info?.vat_exempt;
    const vatRate = applyVat ? Number(vat_rate_percent) : 0;
    const vat_amount = (subtotal * vatRate) / 100;
    const whtRate = Number(withholding_tax_percent);
    const withholding_tax_amount = (subtotal * whtRate) / 100;
    const discount = Number(discount_amount) || 0;
    const net_payable_amount = subtotal + vat_amount - withholding_tax_amount - discount;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).substr(-5)}`;
    const issueDate = new Date();
    const dueDate = new Date(Date.now() + (due_days || 15) * 24 * 60 * 60 * 1000);

    const invoice = new Invoice({
      invoice_number: invoiceNumber,
      client_id: client._id,
      project_id: project_id || null,
      items: computedItems,
      currency: currency || client.financials?.currency || 'USD',
      fx_rate_to_egp: Number(fx_rate_to_egp) || 1.0,
      financial_breakdown: {
        subtotal,
        vat_rate_percent: vatRate,
        vat_amount,
        withholding_tax_percent: whtRate,
        withholding_tax_amount,
        discount_amount: discount,
        net_payable_amount
      },
      status: 'SENT',
      dates: {
        issue_date: issueDate,
        due_date: dueDate
      },
      payment_details: {
        method: payment_method || (currency === 'EGP' ? 'INSTAPAY' : 'BANK_TRANSFER_CIB'),
        instapay_handle: 'iceberg@instapay',
        vodafone_cash_number: '+201000000000'
      },
      notes: notes || ''
    });

    await invoice.save();

    // Mirror to append-only disk ledger
    logFinancialActionToDisk({
      action: 'INVOICE_CREATED',
      invoice_number: invoice.invoice_number,
      client: client.company_name,
      amount: net_payable_amount,
      currency: invoice.currency
    });

    res.status(201).json({ success: true, invoice });
  } catch (err) {
    console.error('[IAMS Invoice POST Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create invoice.' });
  }
});

/**
 * PATCH /api/iams/invoices/:id/status
 * Reconcile payment status
 */
router.patch('/:id/status', verifyToken, authorizeRoles('SUPER_ADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  try {
    const { status, payment_reference, paid_date } = req.body;
    const invoice = await Invoice.findOne({ $or: [{ invoice_id: req.params.id }, { _id: req.params.id }] })
      .populate('client_id', 'company_name financials');

    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found.' });

    invoice.status = status;
    if (status === 'PAID') {
      invoice.dates.paid_date = paid_date ? new Date(paid_date) : new Date();
      if (payment_reference) invoice.payment_details.transaction_reference = payment_reference;

      // Update client lifetime value
      if (invoice.client_id) {
        const client = await Client.findById(invoice.client_id._id);
        if (client) {
          client.financials.total_lifetime_value = (client.financials.total_lifetime_value || 0) + (invoice.financial_breakdown?.net_payable_amount || 0);
          await client.save();
        }
      }

      // Notify dashboard
      await Notification.create({
        type: 'leads',
        title: 'Invoice Payment Received',
        message: `Payment of ${invoice.currency} ${invoice.financial_breakdown?.net_payable_amount} received for ${invoice.invoice_number}.`,
        section: 'iams-billing',
        icon: 'credit-card',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      });
    }

    await invoice.save();

    logFinancialActionToDisk({
      action: `INVOICE_STATUS_${status}`,
      invoice_number: invoice.invoice_number,
      amount: invoice.financial_breakdown?.net_payable_amount,
      currency: invoice.currency
    });

    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update invoice status.' });
  }
});

/**
 * POST /api/iams/invoices/:id/send-whatsapp
 * Generate formatted WhatsApp message template
 */
router.post('/:id/send-whatsapp', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ $or: [{ invoice_id: req.params.id }, { _id: req.params.id }] })
      .populate('client_id', 'company_name contact_person');

    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found.' });

    const phone = invoice.client_id?.contact_person?.whatsapp_number || invoice.client_id?.contact_person?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const message = `Hello ${invoice.client_id?.contact_person?.name || ''},\n\n` +
      `Here is your Iceberg Agency invoice *${invoice.invoice_number}* for *${invoice.client_id?.company_name}*.\n\n` +
      `*Amount Payable:* ${invoice.currency} ${invoice.financial_breakdown?.net_payable_amount}\n` +
      `*Due Date:* ${new Date(invoice.dates.due_date).toLocaleDateString()}\n` +
      `*InstaPay Handle:* ${invoice.payment_details?.instapay_handle}\n\n` +
      `Thank you for partnering with Iceberg Agency!`;

    const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    res.json({
      success: true,
      whatsapp_link: whatsappLink,
      phone: cleanPhone,
      message
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate WhatsApp link.' });
  }
});

module.exports = router;
