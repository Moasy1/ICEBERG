const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

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
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
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
    
    // Confirmation email to user
    const userEmail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting Iceberg Agency',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00d4ff; text-align: center;">Thank You for Contacting Iceberg Agency</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p>Dear ${name},</p>
            <p>Thank you for reaching out to us. We have received your message and will get back to you within 24 hours.</p>
            <p>Here's a copy of your message:</p>
            <div style="background: #ffffff; padding: 15px; border-left: 3px solid #00d4ff; margin: 15px 0;">
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">Best regards,<br>The Iceberg Agency Team</p>
          </div>
        </div>
      `
    };
    
    // Send emails
    await transporter.sendMail(adminEmail);
    await transporter.sendMail(userEmail);
    
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
    // This would typically require authentication
    // For now, returning a placeholder response
    res.json({
      success: true,
      data: [],
      message: 'Contact submissions endpoint - requires authentication'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
