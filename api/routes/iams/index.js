const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const clientsRoutes = require('./clients');
const projectsRoutes = require('./projects');
const tasksRoutes = require('./tasks');
const invoicesRoutes = require('./invoices');
const analyticsRoutes = require('./analytics');

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
