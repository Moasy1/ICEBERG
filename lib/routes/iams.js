const express = require('express');
const router = express.Router();

const authRoutes = require('./iams/auth');
const clientsRoutes = require('./iams/clients');
const projectsRoutes = require('./iams/projects');
const tasksRoutes = require('./iams/tasks');
const invoicesRoutes = require('./iams/invoices');
const analyticsRoutes = require('./iams/analytics');

// Mount sub-routes
router.use('/auth', authRoutes);
router.use('/clients', clientsRoutes);
router.use('/projects', projectsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/analytics', analyticsRoutes);

// Root IAMS health endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ICEBERG Internal Accounts Management System (IAMS)',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
