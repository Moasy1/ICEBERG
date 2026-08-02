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
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "https://www.facebook.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://connect.facebook.net"],
      connectSrc: ["'self'", "https://api.strapi.io", "https://www.facebook.com", "https://connect.facebook.net", "https://graph.facebook.com"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
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

// MongoDB connection helper
let cachedConnection = null;

const connectToDatabase = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  console.log('Connecting to MongoDB...');
  try {
    cachedConnection = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iceberg_cms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
    });
    console.log('Connected to MongoDB');
    return cachedConnection;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Middleware to ensure DB connection for API routes
app.use('/api', async (req, res, next) => {
  if (req.path === '/health' || req.path === '/meta/status' || req.path === '/meta/event') return next();
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(503).json({
      success: false,
      error: 'Database connection failed',
      details: err.message
    });
  }
});

// Import routes
const contentRoutes = require('./routes/content');
const contactRoutes = require('./routes/contact');
const projectRoutes = require('./routes/projects');
const serviceRoutes = require('./routes/services');
const metaRoutes = require('./routes/meta');

// API Routes
app.use('/api/content', contentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/meta', metaRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
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
