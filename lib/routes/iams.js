const express = require('express');
const router = express.Router();

const authRoutes = require('./iams/auth.js');
const clientsRoutes = require('./iams/clients.js');
const projectsRoutes = require('./iams/projects.js');
const tasksRoutes = require('./iams/tasks.js');
const invoicesRoutes = require('./iams/invoices.js');
const analyticsRoutes = require('./iams/analytics.js');

// Mount sub-routes
router.use('/auth', authRoutes);
router.use('/clients', clientsRoutes);
router.use('/projects', projectsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/analytics', analyticsRoutes);

// Root IAMS health endpoint
router.get(['/', '/health'], (req, res) => {
  res.json({
    status: 'OK',
    service: 'ICEBERG Internal Accounts Management System (IAMS)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
