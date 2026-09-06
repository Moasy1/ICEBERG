const express = require('express');
const router = express.Router();
const { DailyPlanner } = require('../../models/DailyPlanner');
const { WorkspaceTask } = require('../../models/WorkspaceTask');
const { verifyToken } = require('../../middleware/auth');
const { resolveWorkspace } = require('../../middleware/tenantIsolation');
const { logAudit, logUserEvent } = require('../../utils/audit');

router.use(verifyToken);
router.use(resolveWorkspace);

// Helper to get formatted YYYY-MM-DD
const getTodayString = () => new Date().toISOString().split('T')[0];

/**
 * GET /api/iams/planner/today
 * Fetch user daily planner for a date (defaults to today) + scheduled/due tasks
 */
router.get('/today', async (req, res) => {
  try {
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const date = req.query.date || getTodayString();
    const wsId = req.workspace.workspace_id;

    let planner = await DailyPlanner.findOne({
      user_id: userId,
      workspace_id: wsId,
      date
    });

    if (!planner) {
      // Find previous day's habits to carry over template
      const prevPlan = await DailyPlanner.findOne({ user_id: userId, workspace_id: wsId })
        .sort({ date: -1 });

      const defaultHabits = prevPlan && prevPlan.habits.length > 0
        ? prevPlan.habits.map(h => ({
            habit_id: 'hab_' + Math.random().toString(36).substring(2, 7),
            title: h.title,
            icon: h.icon || 'check-circle',
            completed: false,
            target_time: h.target_time || null
          }))
        : [
            { habit_id: 'hab_1', title: 'Review Active Client Sprint', icon: 'zap', completed: false, target_time: '09:00' },
            { habit_id: 'hab_2', title: 'Deep Work Block 1 (90m)', icon: 'target', completed: false, target_time: '10:00' },
            { habit_id: 'hab_3', title: 'Inbox & Async Comms Zero', icon: 'mail', completed: false, target_time: '14:00' },
            { habit_id: 'hab_4', title: 'Daily Retrospective Log', icon: 'book-open', completed: false, target_time: '17:30' }
          ];

      planner = new DailyPlanner({
        user_id: userId,
        workspace_id: wsId,
        date,
        scratchpad: '',
        habits: defaultHabits,
        time_blocks: []
      });

      await planner.save();
    }

    // Fetch tasks due today or scheduled for today across workspace
    const dueTasks = await WorkspaceTask.find({
      workspace_id: wsId,
      is_archived: false,
      $or: [
        { due_date: date },
        { scheduled_date: date }
      ]
    }).sort({ priority: -1, position: 1 });

    res.json({
      success: true,
      data: {
        planner,
        due_tasks: dueTasks,
        date
      }
    });
  } catch (err) {
    console.error('Error in daily planner endpoint:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/iams/planner/scratchpad
 * Save scratchpad content (persisted per day)
 */
router.put('/scratchpad', async (req, res) => {
  try {
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const date = req.body.date || getTodayString();
    const { scratchpad } = req.body;
    const wsId = req.workspace.workspace_id;

    const planner = await DailyPlanner.findOneAndUpdate(
      { user_id: userId, workspace_id: wsId, date },
      { $set: { scratchpad, updated_at: new Date() } },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Scratchpad saved.',
      data: planner.scratchpad
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/planner/habits/toggle
 * Toggle habit completion state
 */
router.post('/habits/toggle', async (req, res) => {
  try {
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const date = req.body.date || getTodayString();
    const { habit_id } = req.body;
    const wsId = req.workspace.workspace_id;

    const planner = await DailyPlanner.findOne({ user_id: userId, workspace_id: wsId, date });
    if (!planner) {
      return res.status(404).json({ success: false, error: 'Daily plan not found for date.' });
    }

    const habit = planner.habits.find(h => h.habit_id === habit_id);
    if (!habit) {
      return res.status(404).json({ success: false, error: 'Habit not found.' });
    }

    habit.completed = !habit.completed;
    await planner.save();

    await logAudit({
      req,
      action: 'PLANNER_HABIT_TOGGLED',
      entityType: 'PLANNER',
      entityId: habit_id,
      severity: 'INFO',
      details: { title: habit.title, completed: habit.completed, date }
    });
    await logUserEvent({
      req,
      eventType: 'TOGGLE_HABIT',
      entityType: 'PLANNER',
      entityId: habit_id
    });

    res.json({
      success: true,
      data: planner.habits
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/planner/habits
 * Add a new habit to the day's plan
 */
router.post('/habits', async (req, res) => {
  try {
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const date = req.body.date || getTodayString();
    const { title, icon, target_time } = req.body;
    const wsId = req.workspace.workspace_id;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Habit title is required.' });
    }

    const planner = await DailyPlanner.findOne({ user_id: userId, workspace_id: wsId, date });
    if (!planner) {
      return res.status(404).json({ success: false, error: 'Daily plan not found.' });
    }

    const newHabit = {
      habit_id: 'hab_' + Math.random().toString(36).substring(2, 7),
      title,
      icon: icon || 'check-circle',
      completed: false,
      target_time: target_time || null
    };

    planner.habits.push(newHabit);
    await planner.save();

    res.status(201).json({
      success: true,
      data: planner.habits
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/planner/time-blocks
 * Add or update time block on the hourly grid (drag & drop integration)
 */
router.post('/time-blocks', async (req, res) => {
  try {
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const date = req.body.date || getTodayString();
    const { task_id, title, start_time, duration_minutes = 30, color = '#06b6d4', block_id } = req.body;
    const wsId = req.workspace.workspace_id;

    if (!start_time || !title) {
      return res.status(400).json({ success: false, error: 'Start time and title are required.' });
    }

    let planner = await DailyPlanner.findOne({ user_id: userId, workspace_id: wsId, date });
    if (!planner) {
      planner = new DailyPlanner({ user_id: userId, workspace_id: wsId, date, time_blocks: [] });
    }

    let effectiveBlockId = block_id;
    if (block_id) {
      const idx = planner.time_blocks.findIndex(b => b.block_id === block_id);
      if (idx > -1) {
        planner.time_blocks[idx].start_time = start_time;
        planner.time_blocks[idx].duration_minutes = duration_minutes;
        planner.time_blocks[idx].title = title;
        planner.time_blocks[idx].color = color;
      }
    } else {
      effectiveBlockId = 'blk_' + Math.random().toString(36).substring(2, 8);
      planner.time_blocks.push({
        block_id: effectiveBlockId,
        task_id: task_id || null,
        title,
        start_time,
        duration_minutes,
        color,
        completed: false
      });

      // If mapped from an existing task, also sync the task's scheduled_date and start_time
      if (task_id) {
        await WorkspaceTask.findOneAndUpdate(
          { task_id, workspace_id: wsId },
          { $set: { scheduled_date: date, start_time, duration_minutes } }
        );
      }
    }

    await planner.save();

    await logAudit({
      req,
      action: 'PLANNER_TIMEBLOCK_SAVED',
      entityType: 'PLANNER',
      entityId: effectiveBlockId,
      severity: 'INFO',
      details: { title, start_time, duration_minutes, date }
    });
    await logUserEvent({
      req,
      eventType: 'SAVE_TIMEBLOCK',
      entityType: 'PLANNER',
      entityId: effectiveBlockId,
      durationMs: duration_minutes * 60000
    });

    res.status(201).json({
      success: true,
      message: 'Time block scheduled.',
      data: planner.time_blocks
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/iams/planner/time-blocks/:block_id
 * Remove time block from grid
 */
router.delete('/time-blocks/:block_id', async (req, res) => {
  try {
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const date = req.query.date || getTodayString();
    const { block_id } = req.params;
    const wsId = req.workspace.workspace_id;

    const planner = await DailyPlanner.findOne({ user_id: userId, workspace_id: wsId, date });
    if (!planner) {
      return res.status(404).json({ success: false, error: 'Daily plan not found.' });
    }

    planner.time_blocks = planner.time_blocks.filter(b => b.block_id !== block_id);
    await planner.save();

    await logAudit({
      req,
      action: 'PLANNER_TIMEBLOCK_DELETED',
      entityType: 'PLANNER',
      entityId: block_id,
      severity: 'INFO',
      details: { block_id, date }
    });
    await logUserEvent({
      req,
      eventType: 'DELETE_TIMEBLOCK',
      entityType: 'PLANNER',
      entityId: block_id
    });

    res.json({
      success: true,
      message: 'Time block removed.',
      data: planner.time_blocks
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/iams/planner/reflection
 * Save daily reflection journal and score
 */
router.put('/reflection', async (req, res) => {
  try {
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const date = req.body.date || getTodayString();
    const { reflection_note, productivity_score } = req.body;
    const wsId = req.workspace.workspace_id;

    const planner = await DailyPlanner.findOneAndUpdate(
      { user_id: userId, workspace_id: wsId, date },
      { $set: { reflection_note, productivity_score, updated_at: new Date() } },
      { new: true, upsert: true }
    );

    await logAudit({
      req,
      action: 'PLANNER_REFLECTION_SAVED',
      entityType: 'PLANNER',
      entityId: date,
      severity: 'INFO',
      details: { productivity_score, has_note: !!reflection_note }
    });
    await logUserEvent({
      req,
      eventType: 'SAVE_REFLECTION',
      entityType: 'PLANNER',
      entityId: date
    });

    res.json({
      success: true,
      message: 'Reflection recorded.',
      data: {
        reflection_note: planner.reflection_note,
        productivity_score: planner.productivity_score
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
