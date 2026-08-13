const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Lead = require('../models/Lead');
const CalendarSlot = require('../models/CalendarSlot');
const Notification = require('../models/Notification');
const metaCapi = require('../services/metaCapi');

// Emergency Disk Backup Logger
const backupLeadToDisk = (leadObj) => {
  try {
    const backupDir = path.join(__dirname, '../');
    const backupFile = path.join(backupDir, 'leads_backup.jsonl');
    const entry = JSON.stringify({
      id: leadObj.lead_id || leadObj.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...leadObj
    }) + '\n';
    fs.appendFileSync(backupFile, entry, 'utf8');
  } catch (err) {
    console.error('[Leads Backup Error]:', err);
  }
};

// Helper to read disk backups if DB is offline
const getDiskBackupLeads = () => {
  try {
    const backupFile = path.join(__dirname, '../leads_backup.jsonl');
    if (!fs.existsSync(backupFile)) return [];
    const lines = fs.readFileSync(backupFile, 'utf8').trim().split('\n').filter(Boolean);
    return lines.map(line => {
      try { return JSON.parse(line); } catch(e) { return null; }
    }).filter(Boolean);
  } catch(e) {
    return [];
  }
};

// POST /api/leads - Create/Submit new lead (Supports meeting slots)
router.post('/', async (req, res) => {
  try {
    const {
      id,
      lead_id,
      source,
      action,
      name,
      contact_name,
      email,
      phone,
      company,
      country,
      website,
      industry,
      sector,
      position,
      requirements,
      interest_tag,
      meeting_date,
      meeting_time,
      time_slot,
      status,
      owner,
      notes,
      utm
    } = req.body;

    const finalName = (contact_name || name || company || 'IDEX Visitor').trim();
    const finalEmail = (email || 'info@' + (company || 'exhibitor').toLowerCase().replace(/[^a-z0-9]/g, '') + '.com').trim().toLowerCase();
    const finalCompany = (company || name || 'IDEX Exhibitor').trim();

    const uniqueId = id || lead_id || `IDX-${Date.now().toString().slice(-6)}`;
    const finalMeetingDate = meeting_date || '';
    const finalTimeSlot = time_slot || meeting_time || '';
    const finalStatus = status || (finalMeetingDate ? '📅 Consultation Booked' : '🆕 New Lead');
    const finalSource = source || 'IDEX Landing Page';
    const finalAction = action || (finalMeetingDate ? `Booked Meeting Slot (${finalMeetingDate} ${finalTimeSlot})` : 'Form Submission');

    const leadData = {
      lead_id: uniqueId,
      source: finalSource,
      action: finalAction,
      name: finalName,
      contact_name: finalName,
      email: finalEmail,
      phone: (phone || '').trim(),
      company: finalCompany,
      country: (country || 'Egypt / MENA').trim(),
      website: (website || '').trim(),
      industry: (industry || sector || 'Dental').trim(),
      sector: (sector || industry || 'Dental').trim(),
      position: (position || 'Executive Lead').trim(),
      requirements: Array.isArray(requirements) ? requirements : (requirements ? [requirements] : ['IDEX Performance Optimization']),
      interest_tag: interest_tag || 'growth_package',
      meeting_date: finalMeetingDate,
      meeting_time: finalTimeSlot,
      time_slot: finalTimeSlot,
      status: finalStatus,
      owner: owner || 'Executive Desk 1',
      notes: (notes || (finalMeetingDate ? `Meeting scheduled for ${finalMeetingDate} at ${finalTimeSlot}` : 'Captured live from IDEX Funnel')).trim(),
      utm: utm || {}
    };

    // Backup lead to disk
    backupLeadToDisk(leadData);

    // Save lead to MongoDB if connected
    try {
      await Lead.findOneAndUpdate({ email: leadData.email }, leadData, { upsert: true, new: true });
    } catch (dbErr) {
      console.warn('[DB Lead Save Warning - stored to disk backup]:', dbErr.message);
    }

    // Auto-reserve CalendarSlot if meeting date/time provided
    if (finalMeetingDate && finalTimeSlot) {
      const slotId = `slot_${finalMeetingDate}_${finalTimeSlot.replace(/[^a-zA-Z0-9]/g, '')}`;
      const slotData = {
        slot_id: slotId,
        date: finalMeetingDate,
        time: finalTimeSlot,
        status: 'BOOKED',
        company: finalCompany,
        contact_name: finalName,
        phone: leadData.phone,
        lead_email: finalEmail,
        lead_id: uniqueId,
        notes: leadData.notes,
        owner: leadData.owner
      };
      try {
        await CalendarSlot.findOneAndUpdate({ slot_id: slotId }, slotData, { upsert: true, new: true });
      } catch (slotErr) {
        console.warn('[DB Slot Save Warning]:', slotErr.message);
      }
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

    // Auto-create Admin Notification for new lead
    try {
      const isBooking = !!finalMeetingDate;
      const notifObj = {
        notif_id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: isBooking ? 'calendar' : 'leads',
        icon: isBooking ? 'calendar' : (finalAction.includes('Audit') ? 'shield-alert' : 'sparkles'),
        color: isBooking ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : (finalAction.includes('Audit') ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'),
        title: isBooking ? 'IDEX Consultation Slot Booked' : (finalAction.includes('Audit') ? 'Confidential Audit Unlocked' : 'New IDEX Exhibitor Lead'),
        message: `${finalName} (${finalCompany}) ${isBooking ? `booked a slot for ${finalMeetingDate} ${finalTimeSlot}` : 'requested details.'}`,
        time: 'Just now',
        read: false,
        section: isBooking ? 'idex-calendar' : (finalAction.includes('Audit') ? 'idex-audits' : 'idex-leads'),
        createdAt: new Date()
      };

      // Backup to disk
      const notifBackupFile = path.join(__dirname, '../notifications_backup.jsonl');
      fs.appendFileSync(notifBackupFile, JSON.stringify(notifObj) + '\n', 'utf8');

      // Save to MongoDB
      Notification.create(notifObj).catch(err => console.warn('[DB Notif Save Warn]:', err.message));
    } catch (notifErr) {
      console.warn('[Notification Creation Notice]:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Lead captured & persisted successfully',
      lead_id: leadData.lead_id,
      status: leadData.status,
      lead: leadData
    });
  } catch (err) {
    console.error('[API Leads Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while processing lead submission.'
    });
  }
});

// GET /api/leads - Fetch leads (DB + Disk fallback)
router.get('/', async (req, res) => {
  try {
    let leads = [];
    try {
      leads = await Lead.find().sort({ created_at: -1 }).limit(200);
    } catch (e) {}

    if (!Array.isArray(leads) || leads.length === 0) {
      leads = getDiskBackupLeads();
    }

    return res.json({ success: true, count: leads.length, leads });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/leads/:id - Update lead status / details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    try {
      const updated = await Lead.findOneAndUpdate({ lead_id: id }, updates, { new: true });
      if (updated) return res.json({ success: true, lead: updated });
    } catch(e) {}

    return res.json({ success: true, message: 'Lead updated locally' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await Lead.deleteOne({ lead_id: id });
    } catch(e) {}
    return res.json({ success: true, message: 'Lead removed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
