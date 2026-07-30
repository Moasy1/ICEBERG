const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Message = require('../models/Message');
const metaCapi = require('../services/metaCapi');

// Ensure public/uploads exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File Type Filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, JPG, PNG, GIF, WebP) and PDF documents are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Custom middleware to handle multer errors gracefully
const handleUpload = (req, res, next) => {
  upload.single('idFile')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    next();
  });
};

// Contact form submission
router.post('/submit', handleUpload, async (req, res) => {
  try {
    const { name, email, message, phone, company, business_name, businessName, business_link, businessLink, appointmentDate, appointmentTime, meetingType, notes } = req.body;
    const finalBusinessName = business_name || businessName || company;
    const finalBusinessLink = business_link || businessLink;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    const finalMessage = message || (notes ? `Appointment notes: ${notes}` : 'Wizard Setup Consultation Request');

    // Save message to database
    const newMessage = new Message({
      name,
      email,
      message: finalMessage,
      phone,
      company: company || finalBusinessName,
      businessName: finalBusinessName,
      businessLink: finalBusinessLink,
      appointmentDate,
      appointmentTime,
      meetingType,
      notes,
      attachment: req.file ? `/uploads/${req.file.filename}` : undefined
    });
    await newMessage.save();

    // Trigger Meta Conversions API (CAPI) Lead/Schedule Event
    const eventId = req.body.eventId || req.body.event_id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    metaCapi.sendServerEvent({
      eventName: appointmentDate ? 'Schedule' : 'Lead',
      eventId: eventId,
      userData: {
        email,
        phone,
        name,
        company: finalBusinessName,
        fbp: req.body.fbp,
        fbc: req.body.fbc
      },
      customData: {
        content_name: appointmentDate ? 'Consultation Appointment' : 'Contact Form Submission',
        company: finalBusinessName || undefined,
        business_link: finalBusinessLink || undefined,
        meeting_type: meetingType || undefined
      },
      req
    }).catch(err => console.error('[Meta CAPI Contact Trigger Error]:', err));

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email to admin
    const adminEmail = {
      from: process.env.EMAIL_USER,
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
      subject: `New Setup Wizard & Appointment Booking from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">
            Iceberg Agency - New Consultation & Appointment Setup
          </h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #0f172a;">1. Contact Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            ${finalBusinessName ? `<p><strong>Business Name:</strong> ${finalBusinessName}</p>` : ''}
            ${finalBusinessLink ? `<p><strong>Business Link:</strong> <a href="${finalBusinessLink}" target="_blank">${finalBusinessLink}</a></p>` : ''}
            ${company && company !== finalBusinessName ? `<p><strong>Service / Details:</strong> ${company}</p>` : ''}
            ${req.file ? `<p><strong>Attachment (ID):</strong> <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/uploads/${req.file.filename}">View/Download ID</a></p>` : ''}
          </div>

          ${appointmentDate ? `
          <div style="background: #ecfeff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #06b6d4;">
            <h3 style="margin-top: 0; color: #0891b2;">2. Scheduled Appointment</h3>
            <p><strong>Date:</strong> ${appointmentDate}</p>
            <p><strong>Time Slot:</strong> ${appointmentTime || 'TBD'}</p>
            <p><strong>Meeting Format:</strong> ${meetingType || 'Google Meet'}</p>
          </div>
          ` : ''}

          <div style="background: #ffffff; padding: 20px; border-left: 4px solid #00d4ff; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #0f172a;">Project / Message Details:</h3>
            <p style="white-space: pre-wrap;">${finalMessage}</p>
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
            This email was sent automatically from the Iceberg Agency Setup Wizard.
          </p>
        </div>
      `
    };

    // User Confirmation Email
    const userConfirmationEmail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Appointment & Project Setup Confirmed - Iceberg Agency`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #00d4ff; margin: 0; font-size: 28px;">ICEBERG AGENCY</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Dig Deep. Rise High.</p>
          </div>
          <div style="background: #020617; color: #ffffff; padding: 25px; border-radius: 12px; margin: 20px 0;">
            <h2 style="color: #38bdf8; margin-top: 0;">Setup Confirmed, ${name}!</h2>
            <p style="color: #cbd5e1; line-height: 1.6;">Thank you for getting in touch. Your project consultation and appointment request have been received.</p>

            ${appointmentDate ? `
            <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #38bdf8; margin: 0 0 10px 0; font-size: 16px;">Appointment Summary:</h3>
              <p style="margin: 4px 0; color: #f8fafc;">📅 <strong>Date:</strong> ${appointmentDate}</p>
              <p style="margin: 4px 0; color: #f8fafc;">⏰ <strong>Time:</strong> ${appointmentTime || 'To be confirmed'}</p>
              <p style="margin: 4px 0; color: #f8fafc;">🎥 <strong>Format:</strong> ${meetingType || 'Google Meet Video Call'}</p>
            </div>
            ` : ''}

            <p style="color: #94a3b8; font-size: 14px;">Our lead strategist will reach out to confirm your slot and send over the calendar invite link shortly.</p>
          </div>
        </div>
      `
    };

    // Send emails if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail(adminEmail);
        await transporter.sendMail(userConfirmationEmail);
      } catch (err) {
        console.error('Email sending failed, but message was saved to DB:', err);
      }
    }

    res.json({
      success: true,
      message: 'Your wizard setup and appointment request have been confirmed!',
      data: {
        id: newMessage._id,
        name,
        email,
        appointmentDate,
        appointmentTime,
        meetingType
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message. Please try again later.'
    });
  }
});

// Get contact submissions (for admin)
router.get('/submissions', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update submission status (for admin)
router.put('/submissions/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const message = await Message.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete submission (for admin)
router.delete('/submissions/:id', async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
