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
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'https://icebergma.com',
      'https://www.icebergma.com'
    ];
    if (allowed.includes(origin) || origin.endsWith('.vercel.app') || (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug route inspector
app.get(['/api/debug-routes', '/debug-routes'], (req, res) => {
  res.json({
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
    headers_host: req.headers.host,
    node_env: process.env.NODE_ENV,
    has_mongo: !!process.env.MONGODB_URI
  });
});

// Redirect retired campaign URLs to home
app.get(['/birthday-campaign', '/birthday-campaign.html'], (req, res) => {
  res.redirect(302, '/');
});

// Serve static files before API database middleware so the site can load even if
// the database is temporarily unavailable.
app.use(express.static(path.join(__dirname, '../public'), {
  extensions: ['html', 'htm'],
  index: 'index.html'
}));

// Disable Mongoose command buffering so serverless requests never hang for 10s if DB is cold/offline
mongoose.set('bufferCommands', false);

// MongoDB connection helper with sanitization
let rawMongoUri = (process.env.MONGODB_URI || '').trim().replace(/[\r\n]/g, '');
if (rawMongoUri.includes('V41kIpvmjTI7nn3K')) {
  rawMongoUri = rawMongoUri.replace('V41kIpvmjTI7nn3K', 'V4lKIpvmjTI7nn3K');
}
const MONGO_URI = rawMongoUri || 'mongodb+srv://hmanmahmed_db_user:V4lKIpvmjTI7nn3K@iceberg.4dboitw.mongodb.net/iceberg_cms?retryWrites=true&w=majority';
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
    // Pre-warm DB collections cache in background so first user click is instant
    setImmediate(() => {
      try {
        const dbRoute = require('../lib/routes/iams/database');
        if (typeof dbRoute.warmupCache === 'function') dbRoute.warmupCache();
      } catch (e) {}
    });
    return cachedConnection;
  } catch (err) {
    console.warn('[MongoDB Connection Warning]:', err.message);
    return null;
  }
};

// Middleware to ensure DB connection for all API routes (with /api or without /api)
app.use(async (req, res, next) => {
  const isApi = req.path.startsWith('/api') || req.path.startsWith('/iams') || req.path.startsWith('/leads') || req.path.startsWith('/projects') || req.path.startsWith('/content') || req.path.startsWith('/services') || req.path.startsWith('/calendar') || req.path.startsWith('/contact') || req.path.startsWith('/notifications') || req.path.startsWith('/analytics') || req.path.startsWith('/meta');
  if (!isApi) return next();
  if (req.path === '/health' || req.path === '/api/health' || req.path === '/status' || req.path.includes('/idex/data')) return next();
  try {
    await connectToDatabase();
  } catch (err) {
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
const iamsWorkspacesRoutes = require('../lib/routes/iams/workspaces');
const iamsPlannerRoutes = require('../lib/routes/iams/planner');
const iamsMessagesRoutes = require('../lib/routes/iams/messages');
const iamsDocsRoutes = require('../lib/routes/iams/docs');
const iamsChatRoutes = require('../lib/routes/iams/chat');
const iamsFocusRoutes = require('../lib/routes/iams/focus');
const iamsBookmarksRoutes = require('../lib/routes/iams/bookmarks');
const iamsAuditRoutes = require('../lib/routes/iams/audit');
const iamsBehaviorRoutes = require('../lib/routes/iams/behavior');
const iamsDatabaseRoutes = require('../lib/routes/iams/database');
const iamsOpportunitiesRoutes = require('../lib/routes/iams/opportunities');

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
mountRoute('/iams/workspaces', iamsWorkspacesRoutes);
mountRoute('/iams/planner', iamsPlannerRoutes);
mountRoute('/iams/messages', iamsMessagesRoutes);
mountRoute('/iams/docs', iamsDocsRoutes);
mountRoute('/iams/chat', iamsChatRoutes);
mountRoute('/iams/focus', iamsFocusRoutes);
mountRoute('/iams/bookmarks', iamsBookmarksRoutes);
mountRoute('/iams/audit', iamsAuditRoutes);
mountRoute('/iams/behavior', iamsBehaviorRoutes);
mountRoute('/iams/database', iamsDatabaseRoutes);
mountRoute('/iams/opportunities', iamsOpportunitiesRoutes);

// IAMS Health Check Handlers
const iamsHealthHandler = (req, res) => {
  res.json({
    status: 'OK',
    service: 'ICEBERG Internal Accounts Management System (IAMS)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
};
app.get('/api/iams/health', iamsHealthHandler);
app.get('/iams/health', iamsHealthHandler);
app.get('/api/iams', iamsHealthHandler);
app.get('/iams', iamsHealthHandler);

// IAMS Resilient File Upload Endpoint (Zero-disk ephemeral serverless compatible)
app.post(['/api/iams/upload', '/iams/upload'], (req, res) => {
  try {
    const { name, size, type, data } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'File name is required.' });
    }
    const filePayload = {
      name,
      size: size || 'Unknown size',
      type: type || 'application/octet-stream',
      url: data || '#',
      uploaded_at: new Date().toISOString()
    };
    res.json({ success: true, data: filePayload });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// IAMS Universal File Download Endpoint with Forced Content-Disposition Headers
app.all(['/api/iams/download', '/iams/download'], async (req, res) => {
  try {
    const filename = req.query.name || req.body?.name || 'deliverable.txt';
    const mimeType = req.query.mime || req.body?.type || 'application/octet-stream';
    let data = req.query.data || req.body?.data || '';
    const taskId = req.query.task_id || req.body?.task_id;
    const attachmentId = req.query.attachment_id || req.body?.attachment_id;

    // Optional MongoDB lookup if taskId & attachmentId are provided
    if (taskId && attachmentId) {
      try {
        const WorkspaceTask = require('../lib/models/WorkspaceTask');
        const task = await WorkspaceTask.findOne({ task_id: taskId });
        if (task && task.attachments) {
          const found = task.attachments.find(a => a.attachment_id === attachmentId || a.name === filename);
          if (found && found.url) {
            data = found.url;
          }
        }
      } catch (e) {
        console.warn('[Download DB Lookup Warning]:', e.message);
      }
    }

    // Set download headers
    const safeFilename = filename.replace(/[/\\?%*:|"<>]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);

    // Case A: Data URL (e.g. data:image/png;base64,... or data:application/pdf;base64,...)
    if (data && data.startsWith('data:')) {
      const parts = data.split(';base64,');
      if (parts.length === 2) {
        const detectedMime = parts[0].replace(/^data:/, '') || mimeType;
        const buffer = Buffer.from(parts[1], 'base64');
        res.setHeader('Content-Type', detectedMime);
        res.setHeader('Content-Length', buffer.length);
        return res.end(buffer);
      }
    }

    // Case B: Raw base64 payload
    if (data && !data.startsWith('http') && data.length > 50 && /^[A-Za-z0-9+/=]+$/.test(data.substring(0, 100))) {
      try {
        const buffer = Buffer.from(data, 'base64');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', buffer.length);
        return res.end(buffer);
      } catch (e) {}
    }

    // Case C: Plain text or deliverable summary
    const content = (data && data !== '#')
      ? data
      : `====================================================\nICEBERG DIGITAL MARKETING AGENCY - DELIVERABLE\n====================================================\n\nAsset: ${filename}\nStatus: Verified Deliverable\nTimestamp: ${new Date().toISOString()}\nAgency: Iceberg Digital Marketing Agency\nWebsite: https://icebergma.com\n\nAll intellectual property and deliverables remain confidential under agency retainer terms.\n`;

    const buffer = Buffer.from(content, 'utf-8');
    res.setHeader('Content-Type', mimeType.includes('text') ? mimeType : 'text/plain; charset=utf-8');
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) {
    console.error('Download route error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- Analytics Legacy Compat Shims ----------
// The new analytics logic lives in lib/routes/analytics.js (MongoDB-backed).
// These shims translate the old page-tracker.js POST format to the new endpoint
// so any cached script versions keep working without changes.

// POST /api/analytics/pageview  (legacy) → delegates to /api/analytics/track
app.post(['/api/analytics/pageview', '/analytics/pageview'], (req, res) => {
  const page  = (req.body && req.body.page)     ? String(req.body.page).substring(0, 200)     : '/unknown';
  const label = (req.body && req.body.resource) ? String(req.body.resource).substring(0, 150) : page;
  // Forward to the new route handler internals by re-calling the router
  req.body = { page, label, referrer: req.body.referrer || '', utm_source: '', utm_medium: '', utm_campaign: '' };
  req.url = '/track';
  analyticsRoutes(req, res, () => res.json({ success: true, page }));
});

// GET /api/analytics/pageviews  (legacy) → returns summary in old format
app.get(['/api/analytics/pageviews', '/analytics/pageviews'], async (req, res) => {
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

app.get(['/api/idex/data', '/idex/data'], (req, res) => {
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
const healthHandler = async (req, res) => {
  let connectionError = null;
  try {
    await connectToDatabase();
  } catch (err) {
    connectionError = err.message;
  }

  const uri = process.env.MONGODB_URI || MONGO_URI || '';
  const maskedUri = uri ? uri.replace(/\/\/.*@/, '//****:****@').substring(0, 30) + '...' : 'not set';

  res.json({
    status: connectionError ? 'ERROR' : 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongo: {
      connection_type: process.env.MONGODB_URI ? 'remote' : 'fallback-atlas',
      state: mongoose.connection.readyState,
      state_desc: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
      uri_preview: maskedUri,
      error: connectionError
    }
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler for API routes (both /api/* and root api endpoints)
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/iams') || req.path.startsWith('/leads') || req.path.startsWith('/projects') || req.path.startsWith('/content') || req.path.startsWith('/services') || req.path.startsWith('/calendar') || req.path.startsWith('/contact') || req.path.startsWith('/notifications') || req.path.startsWith('/analytics') || req.path.startsWith('/meta')) {
    return res.status(404).json({ error: 'API route not found', path: req.path });
  }
  next();
});

// 404 handler for unknown web pages
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

// Only listen if running directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
