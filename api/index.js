const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust reverse proxy (Vercel / Hostinger / Cloudflare) for accurate rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://*.facebook.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "https://www.facebook.com", "https://*.facebook.com", "https://*.fbcdn.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://connect.facebook.net", "https://*.facebook.com", "https://*.fbcdn.net", "https://cdn.tailwindcss.com", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://api.strapi.io", "https://www.facebook.com", "https://*.facebook.com", "https://connect.facebook.net", "https://graph.facebook.com", "https://*.fbcdn.net"],
      frameSrc: ["'self'", "https://www.facebook.com", "https://*.facebook.com", "https://web.facebook.com"],
      childSrc: ["'self'", "https://www.facebook.com", "https://*.facebook.com", "https://web.facebook.com"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files before API database middleware so the site can load even if
// the database is temporarily unavailable. Supports clean HTML URLs (e.g. /birthday-campaign -> birthday-campaign.html).
app.use(express.static(path.join(__dirname, '../public'), {
  extensions: ['html', 'htm'],
  index: 'index.html'
}));

// Disable Mongoose command buffering so serverless requests never hang for 10s if DB is cold/offline
mongoose.set('bufferCommands', false);

// MongoDB connection helper
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://hmanmahmed_db_user:V4lKIpvmjTI7nn3K@iceberg.4dboitw.mongodb.net/iceberg_cms?retryWrites=true&w=majority';
let cachedConnection = null;

const connectToDatabase = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    cachedConnection = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    console.log('Connected to MongoDB');
    return cachedConnection;
  } catch (err) {
    console.warn('[MongoDB Connection Warning]:', err.message);
    return null;
  }
};

// Middleware to ensure DB connection for API routes
app.use('/api', async (req, res, next) => {
  if (req.path === '/health' || req.path === '/iams/health' || req.path === '/meta/status' || req.path === '/meta/event' || req.path === '/idex/data') return next();
  try {
    await connectToDatabase();
  } catch (err) {
    // Operate gracefully in fallback mode if MongoDB is offline or disconnected
    console.warn('[DB Middleware Warn]: DB offline, fallback mode active for path:', req.path);
  }
  next();
});

// Import routes
const contentRoutes = require('../lib/routes/content');
const contactRoutes = require('../lib/routes/contact');
const projectRoutes = require('../lib/routes/projects');
const serviceRoutes = require('../lib/routes/services');
const metaRoutes = require('../lib/routes/meta');
const leadsRoutes = require('../lib/routes/leads');
const calendarRoutes = require('../lib/routes/calendar');
const notificationRoutes = require('../lib/routes/notifications');
const analyticsRoutes = require('../lib/routes/analytics');

// IAMS Modular Sub-routes
const iamsAuthRoutes = require('../lib/routes/iams/auth');
const iamsClientsRoutes = require('../lib/routes/iams/clients');
const iamsProjectsRoutes = require('../lib/routes/iams/projects');
const iamsTasksRoutes = require('../lib/routes/iams/tasks');
const iamsInvoicesRoutes = require('../lib/routes/iams/invoices');
const iamsAnalyticsRoutes = require('../lib/routes/iams/analytics');

// Helper to mount routes on both /api/path and /path (handles Vercel rewrite variations)
const mountRoute = (routePath, handler) => {
  app.use(`/api${routePath}`, handler);
  app.use(routePath, handler);
};

// Core API Routes
mountRoute('/content', contentRoutes);
mountRoute('/contact', contactRoutes);
mountRoute('/projects', projectRoutes);
mountRoute('/services', serviceRoutes);
mountRoute('/meta', metaRoutes);
mountRoute('/leads', leadsRoutes);
mountRoute('/calendar', calendarRoutes);
mountRoute('/notifications', notificationRoutes);
mountRoute('/analytics', analyticsRoutes);

// IAMS Modular Routes
mountRoute('/iams/auth', iamsAuthRoutes);
mountRoute('/iams/clients', iamsClientsRoutes);
mountRoute('/iams/projects', iamsProjectsRoutes);
mountRoute('/iams/tasks', iamsTasksRoutes);
mountRoute('/iams/invoices', iamsInvoicesRoutes);
mountRoute('/iams/analytics', iamsAnalyticsRoutes);

app.get(['/api/iams/health', '/iams/health', '/api/iams', '/iams'], (req, res) => {
  res.json({
    status: 'OK',
    service: 'ICEBERG Internal Accounts Management System (IAMS)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ---------- Analytics Legacy Compat Shims ----------
// The new analytics logic lives in lib/routes/analytics.js (MongoDB-backed).
// These shims translate the old page-tracker.js POST format to the new endpoint
// so any cached script versions keep working without changes.

// POST /api/analytics/pageview  (legacy) → delegates to /api/analytics/track
app.post('/api/analytics/pageview', (req, res) => {
  const page  = (req.body && req.body.page)     ? String(req.body.page).substring(0, 200)     : '/unknown';
  const label = (req.body && req.body.resource) ? String(req.body.resource).substring(0, 150) : page;
  // Forward to the new route handler internals by re-calling the router
  req.body = { page, label, referrer: req.body.referrer || '', utm_source: '', utm_medium: '', utm_campaign: '' };
  req.url = '/track';
  analyticsRoutes(req, res, () => res.json({ success: true, page }));
});

// GET /api/analytics/pageviews  (legacy) → returns summary in old format
app.get('/api/analytics/pageviews', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const PageView = require('../lib/models/PageView');
    if (mongoose.connection.readyState !== 1) return res.json({ success: true, total: 0, pages: [] });
    const agg = await PageView.aggregate([
      { $group: { _id: { page: '$page', label: '$label' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);
    const pages = agg.map(d => ({ page: d._id.page, resource: d._id.label, count: d.count }));
    const total = pages.reduce((s, p) => s + p.count, 0);
    res.json({ success: true, total, pages });
  } catch (e) {
    res.json({ success: true, total: 0, pages: [] });
  }
});
// -------------------------------------------------------

app.get('/api/idex/data', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/IDEX Event/data.json'));
});

// Page Route Clean Rewrites
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});
app.get('/idex', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/idex.html'));
});
app.get('/idex/audit', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/idex.html'));
});
app.get('/idex/book', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/idex.html'));
});
app.get('/idex/thank-you', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/idex-thank-you.html'));
});
app.get('/idex/case-study/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/idex.html'));
});

// Health check endpoint
app.get(['/api/health', '/health'], async (req, res) => {
  let connectionError = null;
  try {
    await connectToDatabase();
  } catch (err) {
    connectionError = err.message;
  }

  const uri = process.env.MONGODB_URI || '';
  const maskedUri = uri ? uri.replace(/\/\/.*@/, '//****:****@').substring(0, 30) + '...' : 'not set';

  res.json({
    status: connectionError ? 'ERROR' : 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongo: {
      connection_type: process.env.MONGODB_URI ? 'remote' : 'local',
      state: mongoose.connection.readyState,
      state_desc: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
      uri_preview: maskedUri,
      error: connectionError
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Fallback for page routes (SPA / fallback to index.html)
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Only listen if running directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
