const express = require('express');
const router = express.Router();
const UserEvent = require('../../models/UserEvent');
const User = require('../../models/User');
const { FocusSession } = require('../../models/FocusSession');
const { WorkspaceTask } = require('../../models/WorkspaceTask');
const { MessageTopic } = require('../../models/MessageTopic');
const { DailyPlanner } = require('../../models/DailyPlanner');
const { verifyToken, authorizeRoles } = require('../../middleware/auth');
const { logUserEvent } = require('../../utils/audit');

/**
 * POST /api/iams/behavior/event
 * Lightweight server-side or client event recorder
 */
router.post('/event', async (req, res) => {
  try {
    const { event_type, entity_type, entity_id, session_id, duration_ms, metadata } = req.body;
    if (!event_type) {
      return res.status(400).json({ success: false, error: 'event_type is required.' });
    }

    const event = await logUserEvent({
      req,
      eventType: event_type,
      entityType: entity_type,
      entityId: entity_id,
      sessionId: session_id,
      durationMs: duration_ms,
      metadata
    });

    res.status(201).json({ success: true, event_id: event?.event_id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Guard all analytical queries with RBAC (CEO, CreativeDirector, MarketingManager)
router.use(verifyToken);
router.use(authorizeRoles('CEO', 'CreativeDirector', 'MarketingManager'));

/**
 * GET /api/iams/behavior/dau
 * Daily Active Users (DAU) timeseries for past 30 days
 */
router.get('/dau', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dauData = await UserEvent.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
            user: '$user_email'
          }
        }
      },
      {
        $group: {
          _id: '$_id.day',
          active_users: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format into standard timeline array
    const series = dauData.map(d => ({
      date: d._id,
      active_users: d.active_users
    }));

    res.json({
      success: true,
      series,
      current_dau: series.length ? series[series.length - 1].active_users : 0
    });
  } catch (err) {
    console.error('[IAMS Behavior DAU Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to compute DAU.' });
  }
});

/**
 * GET /api/iams/behavior/users
 * Per-user rollups: events, top actions, last seen, computed productivity score
 */
router.get('/users', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch active users list from DB
    const allUsers = await User.find({ is_active: true }).select('user_id full_name email role department avatar_url last_login').lean();

    // Aggregate events per user over past 7 days
    const eventRollups = await UserEvent.aggregate([
      { $match: { created_at: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: '$user_email',
          total_events: { $sum: 1 },
          last_seen: { $max: '$created_at' },
          event_types: { $push: '$event_type' }
        }
      }
    ]);

    const rollupMap = new Map();
    eventRollups.forEach(r => {
      rollupMap.set(r._id?.toLowerCase(), r);
    });

    const roster = allUsers.map(u => {
      const email = (u.email || '').toLowerCase();
      const r = rollupMap.get(email);
      const totalEvents = r ? r.total_events : 0;
      const lastSeen = r ? r.last_seen : u.last_login || null;

      // Count top action
      let topAction = 'N/A';
      if (r && r.event_types.length) {
        const counts = {};
        r.event_types.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
        topAction = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      }

      // Compute productivity score (0 - 100) based on event density
      const score = Math.min(100, Math.round(totalEvents * 1.5 + (lastSeen ? 20 : 0)));

      return {
        user_id: u.user_id || u._id,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        department: u.department,
        events_this_week: totalEvents,
        top_action: topAction,
        last_seen: lastSeen,
        productivity_score: score
      };
    });

    // Sort by events descending
    roster.sort((a, b) => b.events_this_week - a.events_this_week);

    res.json({
      success: true,
      count: roster.length,
      users: roster
    });
  } catch (err) {
    console.error('[IAMS User Behavior Rollups Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve user behavior roster.' });
  }
});

/**
 * GET /api/iams/behavior/features
 * Feature adoption matrix (% of users using each IAMS tool)
 */
router.get('/features', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalActiveUsersCount = Math.max(1, await User.countDocuments({ is_active: true }));

    const features = [
      { key: 'KANBAN', name: 'Workspaces & Kanban', types: ['CREATE_WORKSPACE_TASK', 'EDIT_WORKSPACE_TASK', 'REORDER_WORKSPACE_TASK'] },
      { key: 'MESSAGES', name: 'Async Discussions', types: ['CREATE_MESSAGE_TOPIC', 'REPLY_MESSAGE_TOPIC'] },
      { key: 'DOCS', name: 'Knowledge Docs', types: ['CREATE_DOC', 'EDIT_DOC', 'VIEW_DOC'] },
      { key: 'PLANNER', name: 'Daily Grid & Habits', types: ['TOGGLE_HABIT', 'SAVE_TIMEBLOCK', 'SAVE_REFLECTION'] },
      { key: 'FOCUS', name: 'Focus Studio & Pomodoro', types: ['LOG_FOCUS_SESSION'] },
      { key: 'BILLING', name: 'Invoices & Ledger', types: ['CREATE_INVOICE', 'UPDATE_INVOICE_STATUS'] },
      { key: 'CLIENTS', name: 'Client CRM', types: ['VIEW_CLIENT', 'EDIT_CLIENT', 'CREATE_CLIENT'] }
    ];

    const adoptionResults = await Promise.all(features.map(async f => {
      const distinctUsers = await UserEvent.distinct('user_email', {
        event_type: { $in: f.types },
        created_at: { $gte: thirtyDaysAgo }
      });

      const userCount = distinctUsers.filter(e => e && e !== 'system').length;
      const adoptionPercent = Math.min(100, Math.round((userCount / totalActiveUsersCount) * 100));

      return {
        key: f.key,
        name: f.name,
        active_users: userCount,
        adoption_percent: adoptionPercent
      };
    }));

    res.json({
      success: true,
      total_users: totalActiveUsersCount,
      features: adoptionResults
    });
  } catch (err) {
    console.error('[IAMS Feature Adoption Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to compute feature adoption matrix.' });
  }
});

/**
 * GET /api/iams/behavior/heatmap
 * 24x7 activity matrix (day of week 0-6 vs hour 0-23)
 */
router.get('/heatmap', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const agg = await UserEvent.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      {
        $project: {
          day_of_week: { $dayOfWeek: '$created_at' }, // 1 (Sun) to 7 (Sat)
          hour: { $hour: '$created_at' }              // 0 to 23
        }
      },
      {
        $group: {
          _id: { day: '$day_of_week', hour: '$hour' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Build complete 7 x 24 matrix (0: Sunday, 6: Saturday)
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
    let maxCount = 0;

    agg.forEach(item => {
      const dayIndex = item._id.day - 1; // Convert 1-7 to 0-6
      const hour = item._id.hour;
      const count = item.count;
      if (grid[dayIndex]) {
        grid[dayIndex][hour] = count;
        if (count > maxCount) maxCount = count;
      }
    });

    res.json({
      success: true,
      grid,
      max_count: maxCount,
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    });
  } catch (err) {
    console.error('[IAMS Heatmap Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to generate activity heatmap.' });
  }
});

/**
 * GET /api/iams/behavior/productivity/:user_id
 * Deep dive on user productivity: focus hours, tasks completed, messages sent, planner adherence
 */
router.get('/productivity/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const user = await User.findOne({ $or: [{ user_id }, { _id: user_id }] });

    const [focusSessions, completedTasks, sentMessages, dailyPlans] = await Promise.all([
      FocusSession.find({
        user_id: user?.user_id || user_id,
        completed: true,
        created_at: { $gte: thirtyDaysAgo }
      }).lean(),
      WorkspaceTask.countDocuments({
        'assignees.user_id': user?.user_id || user_id,
        status: 'DONE',
        updated_at: { $gte: thirtyDaysAgo }
      }),
      MessageTopic.countDocuments({
        'author.user_id': user?.user_id || user_id,
        created_at: { $gte: thirtyDaysAgo }
      }),
      DailyPlanner.find({
        user_id: user?.user_id || user_id,
        created_at: { $gte: thirtyDaysAgo }
      }).lean()
    ]);

    const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const focusHours = (totalFocusMinutes / 60).toFixed(1);

    // Planner adherence: ratio of completed habits
    let totalHabits = 0;
    let completedHabits = 0;
    dailyPlans.forEach(plan => {
      (plan.habits || []).forEach(h => {
        totalHabits++;
        if (h.completed) completedHabits++;
      });
    });
    const habitAdherence = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

    res.json({
      success: true,
      user: {
        user_id: user?.user_id || user_id,
        full_name: user?.full_name || 'Staff Member',
        email: user?.email || ''
      },
      metrics: {
        focus_hours: Number(focusHours),
        completed_tasks: completedTasks,
        messages_sent: sentMessages,
        planner_adherence_percent: habitAdherence,
        logged_days_count: dailyPlans.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve user productivity deep dive.' });
  }
});

/**
 * GET /api/iams/behavior/inactive
 * Users inactive for N days (defaults to 14 days)
 */
router.get('/inactive', async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 14;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Find users who haven't logged an event since cutoffDate
    const activeEmails = await UserEvent.distinct('user_email', {
      created_at: { $gte: cutoffDate }
    });

    const inactiveUsers = await User.find({
      is_active: true,
      email: { $nin: activeEmails }
    }).select('user_id full_name email role department last_login');

    res.json({
      success: true,
      inactive_days_threshold: days,
      count: inactiveUsers.length,
      users: inactiveUsers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to query inactive users.' });
  }
});

module.exports = router;
