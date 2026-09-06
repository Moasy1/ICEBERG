const express = require('express');
const router = express.Router();
const Client = require('../../models/Client');
const Lead = require('../../models/Lead');
const AccountProject = require('../../models/AccountProject');
const Task = require('../../models/Task');
const Invoice = require('../../models/Invoice');
const Notification = require('../../models/Notification');
const { logAudit, logUserEvent } = require('../../utils/audit');
const { verifyToken, authorizeRoles } = require('../../middleware/auth');

/**
 * GET /api/iams/clients
 * List clients with query filtering & pagination
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, industry, am, currency, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (industry) filter.industry = industry;
    if (currency) filter['financials.currency'] = currency;
    if (am) filter.account_manager_id = am;

    if (search) {
      filter.$or = [
        { company_name: { $regex: search, $options: 'i' } },
        { 'contact_person.name': { $regex: search, $options: 'i' } },
        { 'contact_person.email': { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Client.countDocuments(filter);
    const clients = await Client.find(filter)
      .populate('account_manager_id', 'full_name email avatar_url')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      clients
    });
  } catch (err) {
    console.error('[IAMS Clients GET Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve clients.' });
  }
});

/**
 * POST /api/iams/clients
 * Create a new client manually
 */
router.post('/', verifyToken, authorizeRoles('SUPER_ADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  try {
    const {
      company_name,
      contact_person,
      corporate_tax_info,
      industry,
      website_url,
      account_manager_id,
      status,
      financials,
      retainer_quotas,
      contract_period
    } = req.body;

    if (!company_name || !contact_person?.name || !contact_person?.email) {
      return res.status(400).json({ success: false, error: 'Company name and contact person details are required.' });
    }

    const client = new Client({
      company_name,
      contact_person,
      corporate_tax_info: corporate_tax_info || {},
      industry: industry || 'General Business',
      website_url: website_url || '',
      account_manager_id: account_manager_id || null,
      status: status || 'ONBOARDING',
      financials: financials || { currency: 'USD', monthly_retainer: 0 },
      retainer_quotas: retainer_quotas || {},
      contract_period: contract_period || {}
    });

    await client.save();

    await logAudit({
      req,
      action: 'CLIENT_CREATED',
      entityType: 'CLIENT',
      entityId: client.client_id,
      severity: 'INFO',
      after: client.toObject(),
      details: { company_name: client.company_name, retainer: client.financials.monthly_retainer }
    });
    await logUserEvent({
      req,
      eventType: 'CREATE_CLIENT',
      entityType: 'CLIENT',
      entityId: client.client_id
    });

    res.status(201).json({ success: true, client });
  } catch (err) {
    console.error('[IAMS Client POST Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create client.' });
  }
});

/**
 * GET /api/iams/clients/:id
 * Retrieve client account profile with linked projects, active tasks, and invoices
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const client = await Client.findOne({ $or: [{ client_id: req.params.id }, { _id: req.params.id }] })
      .populate('account_manager_id', 'full_name email phone avatar_url');

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client account not found.' });
    }

    const projects = await AccountProject.find({ client_id: client._id })
      .populate('lead_specialist_id', 'full_name email department');
    const tasks = await Task.find({ client_id: client._id })
      .populate('assigned_to_id', 'full_name email')
      .sort({ due_date: 1 });
    const invoices = await Invoice.find({ client_id: client._id })
      .sort({ 'dates.issue_date': -1 });

    await logUserEvent({
      req,
      eventType: 'VIEW_CLIENT',
      entityType: 'CLIENT',
      entityId: client.client_id
    });

    res.json({
      success: true,
      client,
      projects,
      tasks,
      invoices
    });
  } catch (err) {
    console.error('[IAMS Client Detail GET Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve client details.' });
  }
});

/**
 * PUT /api/iams/clients/:id
 * Update client profile
 */
router.put('/:id', verifyToken, authorizeRoles('SUPER_ADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  try {
    const existing = await Client.findOne({ $or: [{ client_id: req.params.id }, { _id: req.params.id }] });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Client account not found.' });
    }

    const beforeState = existing.toObject();

    const client = await Client.findOneAndUpdate(
      { $or: [{ client_id: req.params.id }, { _id: req.params.id }] },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    const afterState = client.toObject();

    await logAudit({
      req,
      action: 'CLIENT_UPDATED',
      entityType: 'CLIENT',
      entityId: client.client_id,
      severity: 'INFO',
      before: beforeState,
      after: afterState,
      details: { company_name: client.company_name }
    });
    await logUserEvent({
      req,
      eventType: 'EDIT_CLIENT',
      entityType: 'CLIENT',
      entityId: client.client_id
    });

    res.json({ success: true, client });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update client.' });
  }
});

/**
 * POST /api/iams/clients/convert-lead/:leadId
 * Lead-to-Client Ingestion Bridge
 */
router.post('/convert-lead/:leadId', verifyToken, authorizeRoles('SUPER_ADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  try {
    const lead = await Lead.findOne({ lead_id: req.params.leadId }) || await Lead.findById(req.params.leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Inbound lead record not found.' });
    }

    const isDomestic = lead.country === 'Egypt' || (lead.phone && lead.phone.startsWith('+20'));

    const newClient = new Client({
      company_name: lead.company && lead.company !== 'Direct Client' ? lead.company : lead.name,
      contact_person: {
        name: lead.contact_name || lead.name,
        email: lead.email,
        phone: lead.phone || '',
        whatsapp_number: lead.phone || '',
        position: lead.position || ''
      },
      industry: lead.industry || 'Dental',
      website_url: lead.website || '',
      originating_lead_id: lead.lead_id,
      status: 'ONBOARDING',
      financials: {
        currency: req.body.currency || (isDomestic ? 'EGP' : 'USD'),
        monthly_retainer: Number(req.body.monthly_retainer) || 0,
        billing_cycle: 'MONTHLY'
      },
      contract_period: {
        start_date: new Date(),
        renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    await newClient.save();

    // Mark lead status
    lead.status = '🤝 Converted to Client';
    await lead.save();

    // Notify the agency team
    await Notification.create({
      type: 'leads',
      title: 'Lead Converted to Account',
      message: `${newClient.company_name} is now an active account in IAMS.`,
      section: 'iams-clients',
      icon: 'user-check',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    });

    await logAudit({
      req,
      action: 'LEAD_CONVERTED_TO_CLIENT',
      entityType: 'CLIENT',
      entityId: newClient.client_id,
      severity: 'INFO',
      after: newClient.toObject(),
      details: { originating_lead_id: lead.lead_id, company_name: newClient.company_name }
    });
    await logUserEvent({
      req,
      eventType: 'CONVERT_LEAD',
      entityType: 'CLIENT',
      entityId: newClient.client_id
    });

    res.status(201).json({
      success: true,
      message: 'Lead converted into client account successfully.',
      client: newClient
    });
  } catch (err) {
    console.error('[IAMS Convert Lead Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to convert lead.' });
  }
});

/**
 * POST /api/iams/clients/:id/meetings
 * Add strategic meeting minutes with action items
 */
router.post('/:id/meetings', verifyToken, authorizeRoles('SUPER_ADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  try {
    const { meeting_type, attendees, summary, action_items } = req.body;
    const client = await Client.findOne({ $or: [{ client_id: req.params.id }, { _id: req.params.id }] });

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found.' });
    }

    const meetingEntry = {
      meeting_id: `mtg_${Date.now()}`,
      meeting_type: meeting_type || 'WEEKLY_SYNC',
      date: new Date(),
      attendees: attendees || [],
      summary: summary || '',
      action_items: action_items || []
    };

    client.meeting_minutes.push(meetingEntry);
    await client.save();

    await logAudit({
      req,
      action: 'CLIENT_MEETING_LOGGED',
      entityType: 'CLIENT',
      entityId: client.client_id,
      severity: 'INFO',
      details: { meeting_type, summary }
    });
    await logUserEvent({
      req,
      eventType: 'LOG_MEETING',
      entityType: 'CLIENT',
      entityId: client.client_id
    });

    res.status(201).json({ success: true, meeting: meetingEntry });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to record meeting minutes.' });
  }
});

/**
 * POST /api/iams/clients/:id/notes
 * Add internal Account Manager note
 */
router.post('/:id/notes', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'Note text required.' });

    const client = await Client.findOne({ $or: [{ client_id: req.params.id }, { _id: req.params.id }] });
    if (!client) return res.status(404).json({ success: false, error: 'Client not found.' });

    const noteEntry = {
      author_id: req.user.id || null,
      author_name: req.user.full_name || 'Account Manager',
      text,
      created_at: new Date()
    };

    client.notes.push(noteEntry);
    await client.save();

    await logAudit({
      req,
      action: 'CLIENT_NOTE_ADDED',
      entityType: 'CLIENT',
      entityId: client.client_id,
      severity: 'INFO',
      details: { note_snippet: text.substring(0, 100) }
    });
    await logUserEvent({
      req,
      eventType: 'ADD_NOTE',
      entityType: 'CLIENT',
      entityId: client.client_id
    });

    res.status(201).json({ success: true, notes: client.notes });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add note.' });
  }
});

module.exports = router;
