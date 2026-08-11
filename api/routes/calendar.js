const express = require('express');
const router = express.Router();
const CalendarSlot = require('../models/CalendarSlot');
const Lead = require('../models/Lead');
const fs = require('fs');
const path = require('path');

// Helper to backup booking to disk
const backupBookingToDisk = (bookingData) => {
  try {
    const backupDir = path.join(__dirname, '../');
    const backupFile = path.join(backupDir, 'leads_backup.jsonl');
    const entry = JSON.stringify({
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      source: 'idex_meeting',
      ...bookingData
    }) + '\n';
    fs.appendFileSync(backupFile, entry, 'utf8');
  } catch (err) {
    console.error('[Calendar Backup Error]:', err);
  }
};

const parseSlotTimes = (dateStr, timeStr) => {
  const [hrStr, minStr = '00'] = (timeStr || '09:00').split(':');
  const hr = parseInt(hrStr, 10);
  const min = parseInt(minStr, 10);
  const startTime = new Date(`${dateStr}T${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}:00.000Z`);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  return { startTime, endTime };
};

// Generate default slots for a given date (09:00 - 17:00 Africa/Cairo)
const getDefaultSlotsForDate = (dateStr) => {
  const hours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
  return hours.map(h => {
    const { startTime, endTime } = parseSlotTimes(dateStr, h);
    return {
      slot_id: `slot_${dateStr}_${h.replace(':', '')}`,
      date: dateStr,
      time: h,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'AVAILABLE',
      owner: 'Sales Team (Africa/Cairo)'
    };
  });
};

// GET /api/calendar/slots - Fetch available slots for date range
router.get('/slots', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Clean expired holds (older than 60 seconds)
    const now = new Date();
    try {
      await CalendarSlot.updateMany(
        { status: 'HELD', held_until: { $lt: now } },
        { status: 'AVAILABLE', held_until: null, held_by_session: null }
      );
    } catch (e) {}

    // Find custom slots from DB
    let dbSlots = [];
    try {
      dbSlots = await CalendarSlot.find({
        start_time: {
          $gte: new Date(`${targetDate}T00:00:00.000Z`),
          $lte: new Date(`${targetDate}T23:59:59.999Z`)
        }
      });
    } catch (e) {}

    // Merge default slots with DB slots
    const defaultSlots = getDefaultSlotsForDate(targetDate);
    const slotsMap = new Map();
    defaultSlots.forEach(s => slotsMap.set(s.time, s));

    dbSlots.forEach(dbS => {
      const timeStr = dbS.start_time.toISOString().substring(11, 16);
      slotsMap.set(timeStr, {
        slot_id: dbS.slot_id,
        date: targetDate,
        time: timeStr,
        start_time: dbS.start_time,
        end_time: dbS.end_time,
        status: dbS.status,
        held_until: dbS.held_until,
        owner: dbS.owner
      });
    });

    const slots = Array.from(slotsMap.values());
    return res.json({ success: true, date: targetDate, slots });
  } catch (err) {
    console.error('[Calendar Slots GET Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/calendar/hold - Hold a slot for 60 seconds
router.post('/hold', async (req, res) => {
  try {
    const { date, time, sessionId } = req.body;
    if (!date || !time) {
      return res.status(400).json({ success: false, error: 'Date and time are required' });
    }

    const { startTime, endTime } = parseSlotTimes(date, time);
    const slotId = `slot_${date}_${time.replace(':', '')}`;
    const heldUntil = new Date(Date.now() + 60 * 1000); // 60s hold

    let slot = null;
    try {
      slot = await CalendarSlot.findOne({ slot_id: slotId });
      if (slot && slot.status === 'BOOKED') {
        return res.status(409).json({ success: false, error: 'Slot is already booked' });
      }

      if (slot && slot.status === 'HELD' && slot.held_until > new Date() && slot.held_by_session !== sessionId) {
        return res.status(409).json({ success: false, error: 'Slot is currently being held by another visitor' });
      }

      if (!slot) {
        slot = new CalendarSlot({
          slot_id: slotId,
          start_time: startTime,
          end_time: endTime,
          status: 'HELD',
          held_until: heldUntil,
          held_by_session: sessionId || 'anon'
        });
      } else {
        slot.status = 'HELD';
        slot.held_until = heldUntil;
        slot.held_by_session = sessionId || 'anon';
      }
      await slot.save();
    } catch (dbErr) {
      console.warn('[Calendar Hold DB Warning]:', dbErr.message);
    }

    return res.json({
      success: true,
      message: 'Slot held for 60 seconds',
      slot_id: slotId,
      held_until: heldUntil.toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/calendar/book - Confirm meeting booking
router.post('/book', async (req, res) => {
  try {
    const { date, time, name, email, phone, company, industry, position, notes, sessionId, utm } = req.body;

    if (!date || !time || !name || !email || !company || !industry) {
      return res.status(400).json({
        success: false,
        error: 'Missing required booking fields (date, time, name, email, company, industry)'
      });
    }

    const slotId = `slot_${date}_${time.replace(':', '')}`;
    const meetingTimeDate = new Date(`${date}T${time}:00.000Z`);

    // Create/update Lead record in CRM with status SCHEDULED
    const leadData = {
      lead_id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      source: 'idex_meeting',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      company: company.trim(),
      industry: industry.trim(),
      position: (position || '').trim(),
      requirements: ['IDEX Consultation Meeting'],
      interest_tag: 'growth_package',
      meeting_time: meetingTimeDate,
      status: 'SCHEDULED',
      owner: 'Sales Team (Africa/Cairo)',
      notes: (notes || '').trim(),
      utm: utm || {}
    };

    // Backup to disk
    backupBookingToDisk({ date, time, ...leadData });

    // Update DB models
    try {
      await Lead.findOneAndUpdate(
        { email: leadData.email },
        leadData,
        { upsert: true, new: true }
      );

      const { startTime, endTime } = parseSlotTimes(date, time);

      await CalendarSlot.findOneAndUpdate(
        { slot_id: slotId },
        {
          slot_id: slotId,
          start_time: startTime,
          end_time: endTime,
          status: 'BOOKED',
          held_until: null,
          lead_id: leadData.lead_id,
          lead_email: leadData.email
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.warn('[Calendar Book DB Warning]:', dbErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Meeting confirmed successfully!',
      lead_id: leadData.lead_id,
      meeting_details: {
        date,
        time,
        timezone: 'Africa/Cairo (UTC+2)',
        location: 'IDEX Exhibition Center / ICEBERG VIP Lounge & Online'
      }
    });
  } catch (err) {
    console.error('[Calendar Book Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/calendar/cancel - Cancel booking
router.post('/cancel', async (req, res) => {
  try {
    const { slotId } = req.body;
    if (!slotId) return res.status(400).json({ success: false, error: 'slotId required' });

    try {
      await CalendarSlot.findOneAndUpdate(
        { slot_id: slotId },
        { status: 'CANCELLED' }
      );
    } catch (e) {}

    return res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/calendar/owner/:id/slots - Owner slots
router.get('/owner/:id/slots', async (req, res) => {
  try {
    const slots = await CalendarSlot.find({ owner: req.params.id }).sort({ start_time: 1 });
    return res.json({ success: true, count: slots.length, slots });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/calendar/lead/:id - Lead bookings
router.get('/lead/:id', async (req, res) => {
  try {
    const slots = await CalendarSlot.find({ lead_id: req.params.id });
    return res.json({ success: true, count: slots.length, slots });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
