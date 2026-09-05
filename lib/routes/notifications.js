const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Notification = require('../models/Notification');
const Lead = require('../models/Lead');
const Message = require('../models/Message');

// Emergency Disk Backup Logger for Notifications
const backupNotificationToDisk = (notifObj) => {
  try {
    const backupDir = path.join(__dirname, '../');
    const backupFile = path.join(backupDir, 'notifications_backup.jsonl');
    const entry = JSON.stringify({
      notif_id: notifObj.notif_id || notifObj.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: notifObj.createdAt || new Date().toISOString(),
      ...notifObj
    }) + '\n';
    fs.appendFileSync(backupFile, entry, 'utf8');
  } catch (err) {
    console.error('[Notifications Disk Backup Error]:', err);
  }
};

// Helper to get disk backup notifications
const getDiskBackupNotifications = () => {
  try {
    const backupFile = path.join(__dirname, '../notifications_backup.jsonl');
    if (!fs.existsSync(backupFile)) return [];
    const lines = fs.readFileSync(backupFile, 'utf8').trim().split('\n').filter(Boolean);
    return lines.map(line => {
      try { return JSON.parse(line); } catch (e) { return null; }
    }).filter(Boolean).reverse();
  } catch (e) {
    return [];
  }
};

// Helper to save entire list back to disk backup
const saveDiskBackupNotifications = (notifList) => {
  try {
    const backupFile = path.join(__dirname, '../notifications_backup.jsonl');
    const content = notifList.map(n => JSON.stringify(n)).join('\n') + (notifList.length ? '\n' : '');
    fs.writeFileSync(backupFile, content, 'utf8');
  } catch (e) {
    console.error('[Save Notifications Disk Backup Error]:', e);
  }
};

// Helper to read disk backup leads if needed for initial synthesis
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

// Calculate human time string from date
function getTimeAgo(dateInput) {
  if (!dateInput) return 'Recently';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Recently';
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

// GET /api/notifications - Retrieve all notifications
router.get('/', async (req, res) => {
  try {
    let notifications = [];

    // Try fetching from MongoDB
    try {
      notifications = await Notification.find().sort({ createdAt: -1 }).limit(100);
    } catch (dbErr) {
      console.warn('[DB Notifications Fetch Warning]:', dbErr.message);
    }

    // Fallback to disk backup if DB yields no results
    if (!Array.isArray(notifications) || notifications.length === 0) {
      notifications = getDiskBackupNotifications();
    }

    // If no notifications exist yet, synthesize initial notifications from real leads and contact submissions
    if (!notifications || notifications.length === 0) {
      const synthesized = [];

      // 1. Fetch real leads (DB or disk)
      let leads = [];
      try {
        leads = await Lead.find().sort({ created_at: -1 }).limit(10);
      } catch (e) {}
      if (!leads || leads.length === 0) {
        leads = getDiskBackupLeads().slice(-10);
      }

      leads.forEach(lead => {
        const isBooking = lead.meeting_date || (lead.action && lead.action.toLowerCase().includes('meeting'));
        synthesized.push({
          notif_id: `notif-lead-${lead.lead_id || lead.id || Math.random().toString(36).substr(2, 6)}`,
          type: isBooking ? 'calendar' : 'leads',
          icon: isBooking ? 'calendar' : (lead.action && lead.action.includes('Audit') ? 'shield-alert' : 'sparkles'),
          color: isBooking
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            : (lead.action && lead.action.includes('Audit') ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'),
          title: isBooking
            ? 'IDEX Consultation Slot Booked'
            : (lead.action && lead.action.includes('Audit') ? 'Confidential Audit Unlocked' : 'New IDEX Exhibitor Lead'),
          message: `${lead.contact_name || lead.name || 'Visitor'} (${lead.company || 'Company'}) ${lead.action || 'requested details.'}`,
          time: getTimeAgo(lead.created_at || lead.timestamp),
          read: false,
          section: isBooking ? 'idex-calendar' : (lead.action && lead.action.includes('Audit') ? 'idex-audits' : 'idex-leads'),
          createdAt: lead.created_at || lead.timestamp || new Date().toISOString()
        });
      });

      // 2. Fetch contact form messages
      let messages = [];
      try {
        messages = await Message.find().sort({ createdAt: -1 }).limit(5);
      } catch (e) {}

      messages.forEach(msg => {
        synthesized.push({
          notif_id: `notif-msg-${msg._id || Math.random().toString(36).substr(2, 6)}`,
          type: 'contact',
          icon: 'mail',
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          title: 'New Contact Form Submission',
          message: `${msg.name} (${msg.email}) sent a message: ${msg.message ? msg.message.substring(0, 70) + '...' : 'Inquiry'}`,
          time: getTimeAgo(msg.createdAt),
          read: false,
          section: 'messages',
          createdAt: msg.createdAt || new Date().toISOString()
        });
      });

      // 3. Always append system initialization notification
      synthesized.push({
        notif_id: 'notif-sys-init',
        type: 'system',
        icon: 'check-circle',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        title: 'System Initialization',
        message: 'IDEX Lead Tracker and Notification Center connected live to backend.',
        time: 'Just now',
        read: true,
        section: 'dashboard',
        createdAt: new Date().toISOString()
      });

      notifications = synthesized;

      // Save synthesized set to disk backup & DB
      notifications.forEach(n => {
        backupNotificationToDisk(n);
        try {
          Notification.findOneAndUpdate({ notif_id: n.notif_id }, n, { upsert: true }).catch(() => {});
        } catch (e) {}
      });
    }

    // Map object schema for frontend format
    const formatted = notifications.map(n => ({
      id: n.notif_id || n.id,
      type: n.type || 'leads',
      icon: n.icon || 'bell',
      color: n.color || 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      title: n.title || 'New Notification',
      message: n.message || '',
      time: n.time || getTimeAgo(n.createdAt),
      read: !!n.read,
      section: n.section || 'idex-leads',
      createdAt: n.createdAt
    }));

    return res.json({
      success: true,
      count: formatted.length,
      unreadCount: formatted.filter(n => !n.read).length,
      notifications: formatted
    });
  } catch (err) {
    console.error('[GET /api/notifications Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications - Create new notification
router.post('/', async (req, res) => {
  try {
    const { type, title, message, section, icon, color } = req.body;

    const notifObj = {
      notif_id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: type || 'leads',
      title: title || 'New Notification',
      message: message || '',
      section: section || 'idex-leads',
      icon: icon || 'sparkles',
      color: color || 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      time: 'Just now',
      read: false,
      createdAt: new Date()
    };

    // Save to disk backup
    backupNotificationToDisk(notifObj);

    // Save to MongoDB if available
    try {
      await Notification.create(notifObj);
    } catch (dbErr) {
      console.warn('[DB Notification Create Warn]:', dbErr.message);
    }

    return res.status(201).json({
      success: true,
      notification: {
        id: notifObj.notif_id,
        ...notifObj
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    // Update DB
    try {
      await Notification.updateMany({ read: false }, { read: true });
    } catch (e) {}

    // Update disk backup
    const diskList = getDiskBackupNotifications();
    diskList.forEach(n => n.read = true);
    saveDiskBackupNotifications(diskList);

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    // Update DB
    try {
      await Notification.findOneAndUpdate({ notif_id: id }, { read: true });
    } catch (e) {}

    // Update disk backup
    const diskList = getDiskBackupNotifications();
    const target = diskList.find(n => (n.notif_id || n.id) === id);
    if (target) {
      target.read = true;
      saveDiskBackupNotifications(diskList);
    }

    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/notifications - Clear all notifications
router.delete('/', async (req, res) => {
  try {
    // Clear DB
    try {
      await Notification.deleteMany({});
    } catch (e) {}

    // Clear disk backup
    saveDiskBackupNotifications([]);

    return res.json({ success: true, message: 'All notifications cleared' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
