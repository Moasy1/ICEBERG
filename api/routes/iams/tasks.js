const express = require('express');
const router = express.Router();
const Task = require('../../models/Task');
const AccountProject = require('../../models/AccountProject');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const AuditLog = require('../../models/AuditLog');
const { verifyToken, authorizeRoles } = require('../../middleware/auth');

/**
 * GET /api/iams/tasks/board
 * Returns tasks structured into the 5 Kanban column stages
 */
router.get('/board', verifyToken, async (req, res) => {
  try {
    const { project_id, client_id, assigned_to, department } = req.query;
    const filter = {};

    if (project_id) filter.project_id = project_id;
    if (client_id) filter.client_id = client_id;
    if (assigned_to) filter.assigned_to_id = assigned_to;

    const tasks = await Task.find(filter)
      .populate('assigned_to_id', 'full_name email department avatar_url')
      .populate('project_id', 'title service_category')
      .populate('client_id', 'company_name')
      .sort({ due_date: 1 });

    const board = {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: []
    };

    tasks.forEach(t => {
      const statusKey = t.status || 'TODO';
      if (board[statusKey]) {
        board[statusKey].push(t);
      } else {
        board.TODO.push(t);
      }
    });

    res.json({ success: true, board, total: tasks.length });
  } catch (err) {
    console.error('[IAMS Kanban Board Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve Kanban board.' });
  }
});

/**
 * GET /api/iams/tasks
 * Flat list of tasks
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { project_id, status, assigned_to } = req.query;
    const filter = {};
    if (project_id) filter.project_id = project_id;
    if (status) filter.status = status;
    if (assigned_to) filter.assigned_to_id = assigned_to;

    const tasks = await Task.find(filter)
      .populate('assigned_to_id', 'full_name email department')
      .populate('project_id', 'title')
      .populate('client_id', 'company_name')
      .sort({ due_date: 1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve tasks.' });
  }
});

/**
 * POST /api/iams/tasks
 * Create a new deliverable task
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      project_id,
      client_id,
      assigned_to_id,
      title,
      description,
      priority,
      status,
      estimated_hours,
      due_date
    } = req.body;

    if (!title || !project_id || !client_id) {
      return res.status(400).json({ success: false, error: 'Project ID, Client ID, and Task title are required.' });
    }

    const task = new Task({
      project_id,
      client_id,
      assigned_to_id: assigned_to_id || null,
      title,
      description: description || '',
      priority: priority || 'MEDIUM',
      status: status || 'TODO',
      time_tracking: {
        estimated_hours: Number(estimated_hours) || 0,
        actual_hours: 0,
        labor_cost_accrued: 0
      },
      due_date: due_date || null
    });

    await task.save();

    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to create task.' });
  }
});

/**
 * PATCH /api/iams/tasks/:id/status
 * Drag-and-drop state transition
 */
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid task status.' });
    }

    const task = await Task.findOne({ $or: [{ task_id: req.params.id }, { _id: req.params.id }] });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    task.status = status;
    if (status === 'DONE' && !task.completed_at) {
      task.completed_at = new Date();
    }

    await task.save();

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update task status.' });
  }
});

/**
 * POST /api/iams/tasks/:id/upload-version
 * Upload versioned deliverable (v1, v2, Final)
 */
router.post('/:id/upload-version', verifyToken, async (req, res) => {
  try {
    const { asset_url, preview_type } = req.body;
    if (!asset_url) return res.status(400).json({ success: false, error: 'Asset URL required.' });

    const task = await Task.findOne({ $or: [{ task_id: req.params.id }, { _id: req.params.id }] });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    const versionNumber = (task.deliverable_versions.length || 0) + 1;
    task.deliverable_versions.push({
      version_number: versionNumber,
      asset_url,
      preview_type: preview_type || 'URL',
      uploaded_by: req.user.id || null,
      created_at: new Date(),
      client_status: 'PENDING_REVIEW'
    });

    task.status = 'IN_REVIEW';
    await task.save();

    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to upload deliverable version.' });
  }
});

/**
 * POST /api/iams/tasks/:id/client-review
 * Client feedback and sign-off
 */
router.post('/:id/client-review', async (req, res) => {
  try {
    const { client_status, client_feedback } = req.body;
    const task = await Task.findOne({ $or: [{ task_id: req.params.id }, { _id: req.params.id }] });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    if (task.deliverable_versions.length > 0) {
      const latestVersion = task.deliverable_versions[task.deliverable_versions.length - 1];
      latestVersion.client_status = client_status;
      latestVersion.client_feedback = client_feedback || '';
      latestVersion.reviewed_at = new Date();
    }

    if (client_status === 'APPROVED') {
      task.status = 'DONE';
      task.completed_at = new Date();
    } else if (client_status === 'CHANGES_REQUESTED') {
      task.status = 'IN_PROGRESS';
      task.revision_rounds_count = (task.revision_rounds_count || 0) + 1;
    }

    await task.save();

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to record client review.' });
  }
});

/**
 * POST /api/iams/tasks/:id/log-hours
 * Specialist logs hours worked
 */
router.post('/:id/log-hours', verifyToken, async (req, res) => {
  try {
    const { hours } = req.body;
    const hoursNum = Number(hours);
    if (!hoursNum || hoursNum <= 0) {
      return res.status(400).json({ success: false, error: 'Valid positive hours count required.' });
    }

    const task = await Task.findOne({ $or: [{ task_id: req.params.id }, { _id: req.params.id }] });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    task.time_tracking.actual_hours = (task.time_tracking.actual_hours || 0) + hoursNum;

    // Calculate labor cost if specialist has hourly rate
    if (task.assigned_to_id) {
      const specialist = await User.findById(task.assigned_to_id);
      if (specialist && specialist.cost_rates?.hourly_cost) {
        task.time_tracking.labor_cost_accrued = (task.time_tracking.actual_hours || 0) * specialist.cost_rates.hourly_cost;
      }
    }

    await task.save();
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to log hours.' });
  }
});

module.exports = router;
