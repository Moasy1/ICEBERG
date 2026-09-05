const express = require('express');
const router = express.Router();
const AccountProject = require('../../models/AccountProject');
const Client = require('../../models/Client');
const AuditLog = require('../../models/AuditLog');
const { verifyToken, authorizeRoles } = require('../../middleware/auth');

/**
 * GET /api/iams/projects
 * List all active projects
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { client_id, service_category, status } = req.query;
    const filter = {};

    if (client_id) filter.client_id = client_id;
    if (service_category) filter.service_category = service_category;
    if (status) filter.status = status;

    const projects = await AccountProject.find(filter)
      .populate('client_id', 'company_name contact_person financials')
      .populate('lead_specialist_id', 'full_name email department')
      .sort({ created_at: -1 });

    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    console.error('[IAMS Projects GET Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve projects.' });
  }
});

/**
 * POST /api/iams/projects
 * Create a new operational client project
 */
router.post('/', verifyToken, authorizeRoles('SUPER_ADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  try {
    const {
      client_id,
      title,
      service_category,
      lead_specialist_id,
      budget,
      links,
      timeline,
      status
    } = req.body;

    if (!client_id || !title || !service_category) {
      return res.status(400).json({ success: false, error: 'Client ID, project title, and service category are required.' });
    }

    const project = new AccountProject({
      client_id,
      title,
      service_category,
      lead_specialist_id: lead_specialist_id || null,
      budget: budget || {},
      links: links || {},
      timeline: timeline || {},
      status: status || 'PLANNING'
    });

    await project.save();

    await AuditLog.create({
      user_id: req.user.id || null,
      user_email: req.user.email || 'system',
      action: 'PROJECT_CREATED',
      entity_type: 'PROJECT',
      entity_id: project.project_id,
      details: { title: project.title, category: project.service_category }
    });

    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to create project.' });
  }
});

/**
 * GET /api/iams/projects/:id
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const project = await AccountProject.findOne({ $or: [{ project_id: req.params.id }, { _id: req.params.id }] })
      .populate('client_id', 'company_name contact_person financials')
      .populate('lead_specialist_id', 'full_name email department');

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve project.' });
  }
});

/**
 * PUT /api/iams/projects/:id
 */
router.put('/:id', verifyToken, authorizeRoles('SUPER_ADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  try {
    const project = await AccountProject.findOneAndUpdate(
      { $or: [{ project_id: req.params.id }, { _id: req.params.id }] },
      { $set: req.body },
      { new: true }
    );

    if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update project.' });
  }
});

/**
 * POST /api/iams/projects/:id/change-request
 * Log an out-of-scope Change Request (CR)
 */
router.post('/:id/change-request', verifyToken, authorizeRoles('SUPER_ADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  try {
    const { title, description, additional_fee, currency } = req.body;
    const project = await AccountProject.findOne({ $or: [{ project_id: req.params.id }, { _id: req.params.id }] });

    if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

    const cr = {
      cr_id: `cr_${Date.now()}`,
      title,
      description,
      additional_fee: Number(additional_fee) || 0,
      currency: currency || 'USD',
      approved_by_client: false
    };

    project.change_requests.push(cr);
    await project.save();

    res.status(201).json({ success: true, change_request: cr });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to log change request.' });
  }
});

module.exports = router;
