const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Lead = require('../models/Lead');
const metaCapi = require('../services/metaCapi');

// Emergency Disk Backup Logger
const backupLeadToDisk = (leadObj) => {
  try {
    const backupDir = path.join(__dirname, '../');
    const backupFile = path.join(backupDir, 'leads_backup.jsonl');
    const entry = JSON.stringify({
      id: leadObj.lead_id || `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...leadObj
    }) + '\n';
    fs.appendFileSync(backupFile, entry, 'utf8');
  } catch (err) {
    console.error('[Leads Backup Error]:', err);
  }
};

// POST /api/leads - Create/Submit new lead
router.post('/', async (req, res) => {
  try {
    const {
      source,
      name,
      email,
      phone,
      company,
      country,
      website,
      industry,
      position,
      requirements,
      interest_tag,
      notes,
      utm
    } = req.body;

    // Validation
    if (!name || !email || !company || !industry) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: Name, Email, Company, and Industry are required.'
      });
    }

    const leadSource = ['idex_audit', 'idex_meeting', 'idex_lead_form', 'idex_qr'].includes(source)
      ? source
      : 'idex_lead_form';

    // Auto-determine interest tag
    let computedInterest = interest_tag;
    if (!computedInterest) {
      if (leadSource === 'idex_audit') {
        computedInterest = 'audit_only';
      } else if (Array.isArray(requirements) && requirements.includes('IDEX Growth Package')) {
        computedInterest = 'growth_package';
      } else if (Array.isArray(requirements) && requirements.length >= 3) {
        computedInterest = 'multiple_services';
      } else {
        computedInterest = 'other';
      }
    }

    const leadData = {
      lead_id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      source: leadSource,
      name: name.trim().substring(0, 100),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim().substring(0, 50),
      company: company.trim().substring(0, 250),
      country: (country || '').trim().substring(0, 100),
      website: (website || '').trim().substring(0, 500),
      industry: industry.trim().substring(0, 150),
      position: (position || '').trim().substring(0, 150),
      requirements: Array.isArray(requirements) ? requirements : (requirements ? [requirements] : []),
      interest_tag: computedInterest,
      status: 'NEW',
      owner: 'Sales Team (Round-Robin)',
      notes: (notes || '').trim().substring(0, 2000),
      utm: utm || {}
    };

    // Always backup to disk first
    backupLeadToDisk(leadData);

    // Save to Mongo DB if connection available
    let createdLead = null;
    try {
      createdLead = await Lead.create(leadData);
    } catch (dbErr) {
      console.warn('[DB Lead Save Warning - saved to backup file]:', dbErr.message);
    }

    // Trigger Meta CAPI Lead Event if configured
    try {
      if (metaCapi && typeof metaCapi.sendLeadEvent === 'function') {
        metaCapi.sendLeadEvent({
          email: leadData.email,
          phone: leadData.phone,
          name: leadData.name,
          eventSourceUrl: req.headers.referer || 'https://iceberg.agency/idex'
        }).catch(err => console.error('[Meta CAPI Lead Event Error]:', err));
      }
    } catch (e) {}

    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead_id: leadData.lead_id,
      status: leadData.status
    });
  } catch (err) {
    console.error('[API Leads Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while processing lead submission.'
    });
  }
});

// GET /api/leads - Fetch leads (admin endpoint)
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ created_at: -1 }).limit(100);
    return res.json({ success: true, count: leads.length, leads });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
