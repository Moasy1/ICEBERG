const express = require('express');
const router = express.Router();
const { FocusSession } = require('../../models/FocusSession');
const { verifyToken } = require('../../middleware/auth');
const { resolveWorkspace } = require('../../middleware/tenantIsolation');
const { logAudit, logUserEvent } = require('../../utils/audit');

router.use(verifyToken);
router.use(resolveWorkspace);

/**
 * POST /api/iams/focus/sessions
 * Log a completed or paused focus/pomodoro interval
 */
router.post('/sessions', async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const {
      mode = 'POMODORO',
      duration_minutes = 25,
      task_id = null,
      project_id = null,
      ambient_sound = 'OFF',
      notes = '',
      completed = true
    } = req.body;

    const sessionId = 'foc_' + Math.random().toString(36).substring(2, 9);

    const newSession = new FocusSession({
      session_id: sessionId,
      workspace_id: wsId,
      user_id: userId,
      task_id,
      project_id,
      mode,
      duration_minutes,
      ambient_sound,
      notes,
      completed,
      started_at: new Date(Date.now() - duration_minutes * 60 * 1000),
      ended_at: new Date()
    });

    await newSession.save();

    await logAudit({
      req,
      action: 'FOCUS_SESSION_LOGGED',
      entityType: 'FOCUS_SESSION',
      entityId: newSession.session_id,
      severity: 'INFO',
      details: { duration_minutes, mode, task_id, completed }
    });
    await logUserEvent({
      req,
      eventType: 'LOG_FOCUS_SESSION',
      entityType: 'FOCUS_SESSION',
      entityId: newSession.session_id,
      durationMs: duration_minutes * 60000
    });

    res.status(201).json({
      success: true,
      message: 'Focus session recorded.',
      data: newSession
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/iams/focus/stats
 * Aggregate focus time, daily streaks, and ambient sound distributions
 */
router.get('/stats', async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Today's completed focus sessions
    const todaySessions = await FocusSession.find({
      workspace_id: wsId,
      user_id: userId,
      mode: 'POMODORO',
      completed: true,
      created_at: { $gte: startOfToday }
    });

    const todayFocusMinutes = todaySessions.reduce((acc, s) => acc + (s.duration_minutes || 25), 0);
    const todayPomodoroCount = todaySessions.length;

    // Past 7 days sessions
    const pastWeekSessions = await FocusSession.find({
      workspace_id: wsId,
      user_id: userId,
      mode: 'POMODORO',
      completed: true,
      created_at: { $gte: sevenDaysAgo }
    }).sort({ created_at: 1 });

    const totalWeekMinutes = pastWeekSessions.reduce((acc, s) => acc + (s.duration_minutes || 25), 0);

    res.json({
      success: true,
      data: {
        today: {
          total_minutes: todayFocusMinutes,
          pomodoro_count: todayPomodoroCount
        },
        week: {
          total_minutes: totalWeekMinutes,
          total_sessions: pastWeekSessions.length
        },
        recent_sessions: pastWeekSessions.slice(-10)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
