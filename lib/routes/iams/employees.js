const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Task = require('../../models/Task');
const WorkspaceTask = require('../../models/WorkspaceTask');
const { logAudit, logUserEvent } = require('../../utils/audit');
const { verifyToken, authorizeRoles } = require('../../middleware/auth');

// Allow CEO and SUPER_ADMIN for all employee operations
const executiveOnly = [verifyToken, authorizeRoles('CEO', 'SUPER_ADMIN')];

/**
 * GET /api/iams/employees
 * List all employee accounts with their onboarding, OKRs, and performance data
 */
router.get('/', executiveOnly, async (req, res) => {
  try {
    const { department, role, is_active } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (role) filter.role = role;
    if (is_active !== undefined) filter.is_active = is_active === 'true';

    const employees = await User.find(filter)
      .select('-password')
      .sort({ created_at: -1 });

    res.json({ success: true, count: employees.length, employees });
  } catch (err) {
    console.error('[IAMS Employees List Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve employee directory.' });
  }
});

/**
 * POST /api/iams/employees
 * Create a new employee account (CEO Only)
 */
router.post('/', executiveOnly, async (req, res) => {
  try {
    const {
      full_name,
      email,
      username,
      password,
      role,
      department,
      phone,
      cost_rates,
      capacity,
      onboarding_buddy
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Full name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, error: 'An employee account with this email already exists.' });
    }

    // Default username if not provided
    const cleanUsername = username ? username.trim().toLowerCase() : cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');

    const newEmployee = new User({
      full_name: full_name.trim(),
      email: cleanEmail,
      username: cleanUsername,
      password: password, // Will be hashed by pre-save hook
      role: role || 'MarketingManager',
      department: department || 'OPERATIONS',
      phone: phone || '',
      cost_rates: {
        hourly_cost: Number(cost_rates?.hourly_cost) || 0,
        currency: cost_rates?.currency || 'EGP'
      },
      capacity: {
        weekly_hours: Number(capacity?.weekly_hours) || 40,
        active_load_hours: 0
      },
      is_active: true,
      must_change_password: true,
      onboarding: {
        status: 'IN_PROGRESS',
        completed_steps: ['credentials'],
        buddy_name: onboarding_buddy || '',
        start_date: new Date(),
        notes: `Account created by Executive CEO on ${new Date().toLocaleDateString()}`
      },
      okrs: [],
      performance_reviews: []
    });

    await newEmployee.save();

    await logAudit({
      req,
      action: 'EMPLOYEE_ACCOUNT_CREATED',
      entityType: 'USER',
      entityId: newEmployee.user_id,
      severity: 'INFO',
      details: { full_name: newEmployee.full_name, email: newEmployee.email, role: newEmployee.role, department: newEmployee.department }
    });
    await logUserEvent({
      req,
      eventType: 'CREATE_EMPLOYEE',
      entityType: 'USER',
      entityId: newEmployee.user_id
    });

    const userObj = newEmployee.toObject();
    delete userObj.password;

    res.status(201).json({ success: true, message: `Account created successfully for ${newEmployee.full_name}`, employee: userObj });
  } catch (err) {
    console.error('[IAMS Employee Create Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create employee account.' });
  }
});

/**
 * PATCH /api/iams/employees/:id
 * Update an existing employee profile
 */
router.patch('/:id', executiveOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { user_id: id }] });
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    const {
      full_name,
      role,
      department,
      phone,
      cost_rates,
      capacity,
      is_active
    } = req.body;

    if (full_name !== undefined) employee.full_name = full_name;
    if (role !== undefined) employee.role = role;
    if (department !== undefined) employee.department = department;
    if (phone !== undefined) employee.phone = phone;
    if (is_active !== undefined) employee.is_active = !!is_active;

    if (cost_rates) {
      if (cost_rates.hourly_cost !== undefined) employee.cost_rates.hourly_cost = Number(cost_rates.hourly_cost);
      if (cost_rates.currency !== undefined) employee.cost_rates.currency = cost_rates.currency;
    }

    if (capacity) {
      if (capacity.weekly_hours !== undefined) employee.capacity.weekly_hours = Number(capacity.weekly_hours);
    }

    await employee.save();

    await logAudit({
      req,
      action: 'EMPLOYEE_ACCOUNT_UPDATED',
      entityType: 'USER',
      entityId: employee.user_id,
      severity: 'INFO',
      details: { role: employee.role, department: employee.department, is_active: employee.is_active }
    });

    const userObj = employee.toObject();
    delete userObj.password;

    res.json({ success: true, message: 'Employee profile updated successfully', employee: userObj });
  } catch (err) {
    console.error('[IAMS Employee Update Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to update employee.' });
  }
});

/**
 * POST /api/iams/employees/:id/reset-password
 * Direct CEO password reset
 */
router.post('/:id/reset-password', executiveOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const employee = await User.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { user_id: id }] });
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    employee.password = new_password; // Triggers bcrypt pre-save hash
    employee.must_change_password = true;
    await employee.save();

    await logAudit({
      req,
      action: 'EMPLOYEE_PASSWORD_RESET_BY_CEO',
      entityType: 'USER',
      entityId: employee.user_id,
      severity: 'HIGH',
      details: { employee_email: employee.email, reset_by: req.user?.email || 'CEO' }
    });

    res.json({ success: true, message: `Password reset successfully for ${employee.full_name}. Temporary credentials updated.` });
  } catch (err) {
    console.error('[IAMS Reset Password Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to reset employee password.' });
  }
});

/**
 * PATCH /api/iams/employees/:id/onboarding
 * Update onboarding roadmap progress & steps
 */
router.patch('/:id/onboarding', executiveOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completed_steps, buddy_name, notes } = req.body;

    const employee = await User.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { user_id: id }] });
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    if (!employee.onboarding) {
      employee.onboarding = { status: 'IN_PROGRESS', completed_steps: [], buddy_name: '', notes: '' };
    }

    if (status !== undefined) employee.onboarding.status = status;
    if (completed_steps !== undefined && Array.isArray(completed_steps)) employee.onboarding.completed_steps = completed_steps;
    if (buddy_name !== undefined) employee.onboarding.buddy_name = buddy_name;
    if (notes !== undefined) employee.onboarding.notes = notes;

    // Auto-complete status if all 6 standard steps are complete
    if (employee.onboarding.completed_steps.length >= 6) {
      employee.onboarding.status = 'COMPLETED';
    }

    await employee.save();

    res.json({ success: true, message: 'Onboarding updated successfully', onboarding: employee.onboarding });
  } catch (err) {
    console.error('[IAMS Update Onboarding Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to update onboarding.' });
  }
});

/**
 * POST /api/iams/employees/:id/okrs
 * Add a new quarterly Objective & Key Results
 */
router.post('/:id/okrs', executiveOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { quarter, objective, category, key_results, status } = req.body;

    if (!objective) {
      return res.status(400).json({ success: false, error: 'Objective statement is required.' });
    }

    const employee = await User.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { user_id: id }] });
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    const formattedKRs = (Array.isArray(key_results) ? key_results : []).map(kr => ({
      kr_id: `kr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: kr.text || 'Key result',
      current: Number(kr.current) || 0,
      target: Number(kr.target) || 100,
      unit: kr.unit || '%'
    }));

    // Calculate initial progress
    let totalProgress = 0;
    if (formattedKRs.length > 0) {
      totalProgress = Math.round(
        formattedKRs.reduce((acc, kr) => acc + Math.min(100, (kr.current / (kr.target || 1)) * 100), 0) / formattedKRs.length
      );
    }

    const newOkr = {
      okr_id: `okr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      quarter: quarter || 'Q1-2026',
      objective,
      category: category || 'DELIVERY',
      key_results: formattedKRs,
      progress: totalProgress,
      status: status || (totalProgress >= 100 ? 'ACHIEVED' : 'ON_TRACK'),
      created_at: new Date()
    };

    if (!employee.okrs) employee.okrs = [];
    employee.okrs.push(newOkr);
    await employee.save();

    res.status(201).json({ success: true, message: 'OKR created successfully', okr: newOkr });
  } catch (err) {
    console.error('[IAMS Create OKR Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create OKR.' });
  }
});

/**
 * PATCH /api/iams/employees/:id/okrs/:okrId
 * Update an existing OKR and its Key Results
 */
router.patch('/:id/okrs/:okrId', executiveOnly, async (req, res) => {
  try {
    const { id, okrId } = req.params;
    const { objective, category, key_results, progress, status, quarter } = req.body;

    const employee = await User.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { user_id: id }] });
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found.' });

    const okr = (employee.okrs || []).find(o => o.okr_id === okrId || o._id?.toString() === okrId);
    if (!okr) return res.status(404).json({ success: false, error: 'OKR not found.' });

    if (objective !== undefined) okr.objective = objective;
    if (category !== undefined) okr.category = category;
    if (quarter !== undefined) okr.quarter = quarter;
    if (status !== undefined) okr.status = status;

    if (Array.isArray(key_results)) {
      okr.key_results = key_results.map(kr => ({
        kr_id: kr.kr_id || `kr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        text: kr.text || 'Key result',
        current: Number(kr.current) || 0,
        target: Number(kr.target) || 100,
        unit: kr.unit || '%'
      }));
      // Re-calculate progress from KRs
      okr.progress = Math.round(
        okr.key_results.reduce((acc, kr) => acc + Math.min(100, (kr.current / (kr.target || 1)) * 100), 0) / okr.key_results.length
      );
    } else if (progress !== undefined) {
      okr.progress = Math.min(100, Math.max(0, Number(progress)));
    }

    if (okr.progress >= 100) okr.status = 'ACHIEVED';

    await employee.save();
    res.json({ success: true, message: 'OKR updated successfully', okr });
  } catch (err) {
    console.error('[IAMS Update OKR Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to update OKR.' });
  }
});

/**
 * DELETE /api/iams/employees/:id/okrs/:okrId
 * Remove an OKR
 */
router.delete('/:id/okrs/:okrId', executiveOnly, async (req, res) => {
  try {
    const { id, okrId } = req.params;
    const employee = await User.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { user_id: id }] });
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found.' });

    employee.okrs = (employee.okrs || []).filter(o => o.okr_id !== okrId && o._id?.toString() !== okrId);
    await employee.save();

    res.json({ success: true, message: 'OKR removed successfully' });
  } catch (err) {
    console.error('[IAMS Delete OKR Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to delete OKR.' });
  }
});

/**
 * POST /api/iams/employees/:id/reviews
 * Add a performance review / appraisal note
 */
router.post('/:id/reviews', executiveOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, notes, category } = req.body;

    const employee = await User.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { user_id: id }] });
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found.' });

    const review = {
      review_id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      reviewer_name: req.user?.full_name || 'CEO',
      date: new Date(),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      notes: notes || '',
      category: category || 'Quarterly Appraisal'
    };

    if (!employee.performance_reviews) employee.performance_reviews = [];
    employee.performance_reviews.push(review);
    await employee.save();

    res.status(201).json({ success: true, message: 'Performance appraisal recorded', review });
  } catch (err) {
    console.error('[IAMS Add Review Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to save appraisal.' });
  }
});

/**
 * GET /api/iams/employees/performance
 * Live aggregate performance metrics across all specialists
 */
router.get('/performance', executiveOnly, async (req, res) => {
  try {
    const employees = await User.find({ is_active: true }).select('user_id full_name email role department avatar_url cost_rates capacity performance_reviews okrs');
    const allTasks = await Task.find({}).lean();
    const allWorkspaceTasks = await WorkspaceTask.find({}).lean().catch(() => []);

    const performanceReport = employees.map(emp => {
      const empIdStr = emp._id.toString();
      const empUserId = emp.user_id;

      // Filter tasks assigned to this employee
      const assignedTasks = allTasks.filter(t => {
        if (!t.assigned_to_id) return false;
        const aId = t.assigned_to_id.toString();
        return aId === empIdStr || aId === empUserId;
      });

      const wsAssigned = allWorkspaceTasks.filter(wt => {
        if (!wt.assignees) return false;
        return wt.assignees.some(a => a.user_id === empUserId || a.full_name === emp.full_name);
      });

      const totalTasks = assignedTasks.length + wsAssigned.length;
      const completedTasks = assignedTasks.filter(t => t.status === 'DONE').length + wsAssigned.filter(t => t.status === 'DONE' || t.status === 'approved').length;
      const inProgressTasks = assignedTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length + wsAssigned.filter(t => t.status === 'IN_PROGRESS' || t.status === 'in_progress').length;
      const backlogTasks = totalTasks - completedTasks - inProgressTasks;

      // Hours calculations
      let estimatedHours = 0;
      let actualHours = 0;
      assignedTasks.forEach(t => {
        estimatedHours += Number(t.time_tracking?.estimated_hours) || 0;
        actualHours += Number(t.time_tracking?.actual_hours) || 0;
      });

      // On-time completion estimate
      const overdueTasks = assignedTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE').length;
      const onTimeRate = totalTasks > 0 ? Math.max(0, Math.round(((totalTasks - overdueTasks) / totalTasks) * 100)) : 100;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

      // Average review rating
      const reviews = emp.performance_reviews || [];
      const avgRating = reviews.length > 0 
        ? Number((reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1))
        : 5.0;

      // OKR progress
      const okrs = emp.okrs || [];
      const avgOkrProgress = okrs.length > 0
        ? Math.round(okrs.reduce((acc, o) => acc + (o.progress || 0), 0) / okrs.length)
        : 0;

      return {
        user_id: emp.user_id,
        _id: emp._id,
        full_name: emp.full_name,
        email: emp.email,
        role: emp.role,
        department: emp.department,
        avatar_url: emp.avatar_url,
        hourly_rate: emp.cost_rates?.hourly_cost || 0,
        currency: emp.cost_rates?.currency || 'EGP',
        weekly_capacity: emp.capacity?.weekly_hours || 40,
        metrics: {
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          in_progress_tasks: inProgressTasks,
          backlog_tasks: Math.max(0, backlogTasks),
          completion_rate: completionRate,
          on_time_rate: onTimeRate,
          estimated_hours: estimatedHours,
          actual_hours: actualHours,
          hours_variance: actualHours - estimatedHours,
          efficiency_score: estimatedHours > 0 ? Math.min(100, Math.round((estimatedHours / Math.max(actualHours, 1)) * 100)) : 95,
          avg_rating: avgRating,
          reviews_count: reviews.length,
          active_okrs_count: okrs.length,
          avg_okr_progress: avgOkrProgress
        },
        recent_reviews: reviews.slice(-3)
      };
    });

    res.json({ success: true, count: performanceReport.length, performance: performanceReport });
  } catch (err) {
    console.error('[IAMS Performance Report Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to generate performance scorecard.' });
  }
});

module.exports = router;
