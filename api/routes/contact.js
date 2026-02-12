const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
const Message = require('../models/Message');

// Contact form submission
router.post('/submit', async (req, res) => {
  try {
    const { name, email, message, phone, company } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and message are required'
      });
    }

    // Save message to database
    const newMessage = new Message({
      name,
      email,
      message,
      phone,
      company
    });
    await newMessage.save();

    // Create email transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
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
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
          </div>
          <div style="background: #ffffff; padding: 20px; border-left: 4px solid #00d4ff; margin: 20px 0;">
            <h3 style="margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
            This email was sent from the Iceberg Agency contact form.
          </p>
        </div>
      `
    };

    // Send email to admin (optional check if configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail(adminEmail);
      } catch (err) {
        console.error('Email sending failed, but message was saved to DB:', err);
      }
    }

    res.json({
      success: true,
      message: 'Your message has been sent successfully. We will contact you soon!'
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

module.exports = router;
