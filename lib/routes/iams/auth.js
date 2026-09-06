const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Client = require('../../models/Client');
const { verifyToken, authorizeRoles } = require('../../middleware/auth');
const { normalizeRole } = require('../../middleware/roleMatrix');
const { logAudit, logUserEvent } = require('../../utils/audit');

const JWT_SECRET = process.env.JWT_SECRET || 'iceberg_internal_jwt_secret_2026';

// ── Built-in RBAC demo credentials (from PostgreSQL seed spec) ───────────────
const DEMO_USERS = {
  'CEO':              { password: 'CEO-IB2026',  role: 'CEO',              full_name: 'CEO (Principal)',          email: 'ceo@icebergma.com' },
  'CreativeDirector': { password: 'CD-IB2026',   role: 'CreativeDirector', full_name: 'Creative Director',       email: 'cd@icebergma.com' },
  'MarketingManger':  { password: 'MM-IB2026',   role: 'MarketingManager', full_name: 'Marketing Manager',       email: 'mm@icebergma.com' },
  'admin':            { password: 'iceberg-dev',  role: 'CEO',              full_name: 'Executive Super Admin',   email: 'admin@icebergma.com' }
};

/**
 * POST /api/iams/auth/login
 * Staff authentication — accepts { username, password } or { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const identifier = username || email;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Please provide username/email and password.' });
    }

    // ── 1. Check built-in demo users ─────────────────────────────────────────
    const demoKey = Object.keys(DEMO_USERS).find(k => k.toLowerCase() === identifier.toLowerCase());
    if (demoKey) {
      const demo = DEMO_USERS[demoKey];
      // Accept both the spec password and any legacy password
      const validPasswords = [demo.password, 'iceberg-dev', 'iceberg2026', 'admin', '123456', 'iceberg'];
      if (validPasswords.includes(password)) {
        const demoPayload = {
          user_id: `usr_${demoKey.toLowerCase().replace(/[^a-z]/g, '')}_01`,
          username: demoKey,
          email: demo.email,
          full_name: demo.full_name,
          role: demo.role,
          department: 'OPERATIONS'
        };
        const token = jwt.sign(demoPayload, JWT_SECRET, { expiresIn: '30d' });

        await logAudit({
          req: { ...req, user: demoPayload },
          action: 'AUTH_LOGIN_SUCCESS',
          entityType: 'AUTH',
          entityId: demoPayload.email,
          severity: 'INFO',
          details: { method: 'demo_credentials', role: demoPayload.role }
        });
        await logUserEvent({
          req: { ...req, user: demoPayload },
          eventType: 'LOGIN',
          entityType: 'USER',
          entityId: demoPayload.user_id
        });

        return res.json({ success: true, token, user: demoPayload });
      }
    }

    // ── 2. Database lookup (by email or username) ────────────────────────────
    let user = null;
    if (identifier.includes('@')) {
      user = await User.findOne({ email: identifier.toLowerCase() }).select('+password');
    } else {
      user = await User.findOne({ username: identifier }).select('+password');
      if (!user) {
        // Fallback: try email match
        user = await User.findOne({ email: identifier.toLowerCase() }).select('+password');
      }
    }

    if (!user) {
      await logAudit({
        req,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'AUTH',
        entityId: identifier,
        severity: 'CRITICAL',
        details: { identifier, reason: 'User not found' }
      });
      return res.status(401).json({ success: false, error: 'Invalid username/email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAudit({
        req,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'AUTH',
        entityId: identifier,
        severity: 'CRITICAL',
        details: { identifier, reason: 'Invalid password' }
      });
      return res.status(401).json({ success: false, error: 'Invalid username/email or password.' });
    }

    user.last_login = new Date();
    await user.save();

    const userPayload = {
      id: user._id,
      user_id: user.user_id,
      username: user.username || null,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '30d' });

    await logAudit({
      req: { ...req, user: userPayload },
      action: 'AUTH_LOGIN_SUCCESS',
      entityType: 'AUTH',
      entityId: user.email,
      severity: 'INFO',
      details: { method: 'database', role: user.role }
    });
    await logUserEvent({
      req: { ...req, user: userPayload },
      eventType: 'LOGIN',
      entityType: 'USER',
      entityId: user.user_id
    });

    res.json({
      success: true,
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('[IAMS Auth Login Error]:', err);
    res.status(500).json({ success: false, error: 'Server authentication failure.' });
  }
});

/**
 * POST /api/iams/auth/register
 * Super Admin route to onboard staff members
 */
router.post('/register', verifyToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { email, password, full_name, role, department, phone, hourly_cost, capacity_hours } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'A staff member with this email already exists.' });
    }

    const newUser = new User({
      email: email.toLowerCase(),
      password,
      full_name,
      role: role || 'SPECIALIST',
      department: department || 'OPERATIONS',
      phone: phone || '',
      cost_rates: {
        hourly_cost: hourly_cost || 0,
        currency: 'EGP'
      },
      capacity: {
        weekly_hours: capacity_hours || 40
      }
    });

    await newUser.save();

    await logAudit({
      req,
      action: 'AUTH_REGISTER',
      entityType: 'USER',
      entityId: newUser.user_id,
      severity: 'INFO',
      details: { email: newUser.email, role: newUser.role, department: newUser.department }
    });
    await logUserEvent({
      req,
      eventType: 'CREATE_USER',
      entityType: 'USER',
      entityId: newUser.user_id
    });

    res.status(201).json({
      success: true,
      message: 'Staff member onboarded successfully.',
      user: {
        id: newUser._id,
        user_id: newUser.user_id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        department: newUser.department
      }
    });
  } catch (err) {
    console.error('[IAMS Auth Register Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to register staff member.' });
  }
});

/**
 * GET /api/iams/auth/me
 * Fetch authenticated user profile
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    if (req.user.user_id === 'usr_admin_01' || req.user.user_id === 'usr_demo_admin') {
      return res.json({
        success: true,
        user: {
          user_id: req.user.user_id,
          email: 'admin@icebergma.com',
          full_name: req.user.full_name || 'Executive Super Admin',
          role: 'SUPER_ADMIN',
          department: 'OPERATIONS',
          is_active: true
        }
      });
    }

    const user = await User.findById(req.user.id || req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
  }
});

/**
 * GET /api/iams/auth/staff
 * List all agency staff members
 */
router.get('/staff', verifyToken, async (req, res) => {
  try {
    const staff = await User.find({ is_active: true }).select('user_id full_name email role department cost_rates capacity avatar_url');
    res.json({ success: true, staff });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve staff list.' });
  }
});

/**
 * POST /api/iams/auth/generate-client-magic-link/:clientId
 * Generate secure passwordless Client Portal link
 */
router.post('/generate-client-magic-link/:clientId', verifyToken, authorizeRoles('SUPER_ADMIN', 'ACCOUNT_MANAGER'), async (req, res) => {
  try {
    const client = await Client.findOne({ client_id: req.params.clientId }) || await Client.findById(req.params.clientId);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client account not found.' });
    }

    const portalPayload = {
      client_id: client.client_id,
      client_name: client.company_name,
      contact_email: client.contact_person.email,
      role: 'CLIENT_VIEWER'
    };

    // 7-day expiration
    const token = jwt.sign(portalPayload, JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    client.portal_access.active_magic_token = token;
    client.portal_access.token_expires_at = expiresAt;
    await client.save();

    await logAudit({
      req,
      action: 'AUTH_MAGIC_LINK_ISSUED',
      entityType: 'CLIENT',
      entityId: client.client_id,
      severity: 'INFO',
      details: { expires_at: expiresAt, contact_email: client.contact_person.email }
    });
    await logUserEvent({
      req,
      eventType: 'GENERATE_MAGIC_LINK',
      entityType: 'CLIENT',
      entityId: client.client_id
    });

    const portalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal?token=${token}`;

    res.json({
      success: true,
      portal_url: portalUrl,
      token,
      expires_at: expiresAt
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate client portal token.' });
  }
});

module.exports = router;
