const express = require('express');
const router = express.Router();
const { Workspace } = require('../../models/Workspace');
const { WorkspaceProject } = require('../../models/WorkspaceProject');
const { WorkspaceTask } = require('../../models/WorkspaceTask');
const { verifyToken } = require('../../middleware/auth');
const { resolveWorkspace, requireWorkspaceRole, scopedProjectAccess } = require('../../middleware/tenantIsolation');
const { LexoRank } = require('../../services/lexorank');

// Middleware stack for all workspace routes
router.use(verifyToken);
router.use(resolveWorkspace);

// ==========================================
// 1. WORKSPACE CORE ENDPOINTS
// ==========================================

/**
 * GET /api/iams/workspaces
 * List all workspaces accessible by the user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const workspaces = await Workspace.find({
      $or: [
        { owner_user_id: userId },
        { 'members.user_id': userId },
        { is_default: true }
      ]
    }).sort({ created_at: -1 });

    res.json({
      success: true,
      data: workspaces,
      current_workspace: req.workspace
    });
  } catch (err) {
    console.error('Error fetching workspaces:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/workspaces
 * Create a new workspace
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const { name, slug, description, settings } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Workspace name is required.' });
    }

    const wsSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const wsId = 'ws_' + Math.random().toString(36).substring(2, 9);

    const newWorkspace = new Workspace({
      workspace_id: wsId,
      name,
      slug: wsSlug,
      description: description || '',
      owner_user_id: userId,
      members: [
        {
          user_id: userId,
          email: req.user.email || 'admin@icebergma.com',
          full_name: req.user.full_name || 'Workspace Owner',
          role: 'ADMIN',
          status: 'ACTIVE',
          assigned_projects: []
        }
      ],
      settings: settings || {}
    });

    await newWorkspace.save();

    // Create a default starter project
    const defaultProject = new WorkspaceProject({
      project_id: 'prj_' + Math.random().toString(36).substring(2, 9),
      workspace_id: wsId,
      name: 'General Operations',
      description: 'Master list for agency operations and team coordination',
      color: '#06b6d4',
      icon: 'briefcase',
      sections: [
        { section_id: 'sec_backlog', name: 'Backlog', position: '0|h00000:', color: '#64748b' },
        { section_id: 'sec_in_progress', name: 'In Progress', position: '0|h00001:', color: '#06b6d4' },
        { section_id: 'sec_review', name: 'Client Review', position: '0|h00002:', color: '#f59e0b' },
        { section_id: 'sec_done', name: 'Completed', position: '0|h00003:', color: '#10b981' }
      ],
      created_by: userId
    });

    await defaultProject.save();

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully.',
      data: newWorkspace,
      default_project: defaultProject
    });
  } catch (err) {
    console.error('Error creating workspace:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/iams/workspaces/:workspace_id
 * Get details of a specific workspace
 */
router.get('/:workspace_id', async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.workspace
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/workspaces/:workspace_id/members
 * Invite or add member/guest to workspace
 */
router.post('/:workspace_id/members', requireWorkspaceRole('ADMIN'), async (req, res) => {
  try {
    const { email, full_name, role = 'MEMBER', assigned_projects = [] } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Member email is required.' });
    }

    const workspace = req.workspace;
    const existingIndex = workspace.members.findIndex(m => m.email === email);

    const memberData = {
      user_id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      full_name: full_name || email.split('@')[0],
      role,
      assigned_projects: role === 'GUEST' ? assigned_projects : [],
      status: 'ACTIVE',
      joined_at: new Date()
    };

    if (existingIndex > -1) {
      workspace.members[existingIndex] = memberData;
    } else {
      workspace.members.push(memberData);
    }

    await workspace.save();

    res.json({
      success: true,
      message: `Member ${email} added as ${role}.`,
      data: workspace.members
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. WORKSPACE PROJECTS (LISTS & TOOLS)
// ==========================================

/**
 * GET /api/iams/workspaces/:workspace_id/projects
 * List projects within current workspace (strictly scoped for guests)
 */
router.get('/:workspace_id/projects', async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const filter = { workspace_id: wsId, is_archived: false };

    // Guest isolation: if role is GUEST or CLIENT_VIEWER, restrict to assigned projects
    if (req.workspaceMembership?.role === 'GUEST' || req.workspaceMembership?.role === 'CLIENT_VIEWER') {
      const allowed = req.workspaceMembership.assigned_projects || [];
      filter.project_id = { $in: allowed };
    }

    const projects = await WorkspaceProject.find(filter).sort({ position: 1, created_at: -1 });

    res.json({
      success: true,
      data: projects
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/workspaces/:workspace_id/projects
 * Create a new project list with custom tools configuration
 */
router.post('/:workspace_id/projects', requireWorkspaceRole('ADMIN', 'MEMBER'), async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const { name, description, color, icon, client_id, enabled_tools, sections } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Project name is required.' });
    }

    // Determine position for new project
    const lastPrj = await WorkspaceProject.findOne({ workspace_id: wsId }).sort({ position: -1 });
    const position = LexoRank.getBetween(lastPrj ? lastPrj.position : null, null);

    const newProject = new WorkspaceProject({
      project_id: 'prj_' + Math.random().toString(36).substring(2, 9),
      workspace_id: wsId,
      name,
      description: description || '',
      color: color || '#06b6d4',
      icon: icon || 'folder',
      client_id: client_id || null,
      enabled_tools: enabled_tools || {
        tasks: true,
        kanban: true,
        calendar: true,
        messages: true,
        docs: true,
        files: true,
        bookmarks: true,
        chat: true
      },
      sections: sections || [
        { section_id: 'sec_todo', name: 'To Do', position: '0|h00000:', color: '#64748b' },
        { section_id: 'sec_progress', name: 'In Progress', position: '0|h00001:', color: '#06b6d4' },
        { section_id: 'sec_review', name: 'Review', position: '0|h00002:', color: '#f59e0b' },
        { section_id: 'sec_done', name: 'Done', position: '0|h00003:', color: '#10b981' }
      ],
      position,
      created_by: userId
    });

    await newProject.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: newProject
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/iams/workspaces/:workspace_id/projects/:project_id
 * Update project details and enabled tools
 */
router.put('/:workspace_id/projects/:project_id', scopedProjectAccess('project_id'), async (req, res) => {
  try {
    const { project_id } = req.params;
    const updates = req.body;

    const project = await WorkspaceProject.findOneAndUpdate(
      { project_id, workspace_id: req.workspace.workspace_id },
      { $set: updates, updated_at: new Date() },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. WORKSPACE TASKS (LEXORANK & TIMEBLOCKS)
// ==========================================

/**
 * GET /api/iams/workspaces/:workspace_id/tasks
 * Query tasks across the workspace with filtering
 */
router.get('/:workspace_id/tasks', async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const { project_id, status, assignee_id, priority, due_date, scheduled_date } = req.query;

    const query = { workspace_id: wsId, is_archived: false };

    // Guest isolation check
    if (req.workspaceMembership?.role === 'GUEST' || req.workspaceMembership?.role === 'CLIENT_VIEWER') {
      const allowed = req.workspaceMembership.assigned_projects || [];
      if (project_id && !allowed.includes(project_id)) {
        return res.status(403).json({ success: false, error: 'Access denied to this project tasks.' });
      }
      query.project_id = project_id ? project_id : { $in: allowed };
    } else if (project_id) {
      query.project_id = project_id;
    }

    if (status) query.status = status;
    if (assignee_id) query['assignees.user_id'] = assignee_id;
    if (priority) query.priority = priority;
    if (due_date) query.due_date = due_date;
    if (scheduled_date) query.scheduled_date = scheduled_date;

    const tasks = await WorkspaceTask.find(query).sort({ position: 1, created_at: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/iams/workspaces/:workspace_id/tasks
 * Create a new task with automatic LexoRank calculation
 */
router.post('/:workspace_id/tasks', async (req, res) => {
  try {
    const wsId = req.workspace.workspace_id;
    const userId = req.user.user_id || req.user._id || 'usr_demo_admin';
    const {
      project_id,
      title,
      description,
      status = 'TODO',
      priority = 'MEDIUM',
      assignees = [],
      section_id = null,
      due_date = null,
      scheduled_date = null,
      start_time = null,
      duration_minutes = 30,
      tags = [],
      subtasks = []
    } = req.body;

    if (!title || !project_id) {
      return res.status(400).json({ success: false, error: 'Title and Project ID are required.' });
    }

    // Calculate LexoRank position at bottom of the section/status column
    const lastTask = await WorkspaceTask.findOne({
      workspace_id: wsId,
      project_id,
      status,
      section_id
    }).sort({ position: -1 });

    const newPosition = LexoRank.getBetween(lastTask ? lastTask.position : null, null);

    const newTask = new WorkspaceTask({
      task_id: 'tsk_' + Math.random().toString(36).substring(2, 9),
      workspace_id: wsId,
      project_id,
      title,
      description: description || '',
      status,
      priority,
      position: newPosition,
      section_id,
      assignees,
      due_date,
      scheduled_date,
      start_time,
      duration_minutes,
      tags,
      subtasks: subtasks.map((st, i) => ({
        subtask_id: 'sub_' + Math.random().toString(36).substring(2, 7),
        title: st.title || st,
        completed: !!st.completed,
        position: i
      })),
      created_by: userId
    });

    await newTask.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: newTask
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/iams/workspaces/:workspace_id/tasks/:task_id/reorder
 * Fractional indexing reordering engine: O(1) position calculation
 */
router.put('/:workspace_id/tasks/:task_id/reorder', async (req, res) => {
  try {
    const { task_id } = req.params;
    const { prev_position, next_position, target_status, target_section_id } = req.body;

    const task = await WorkspaceTask.findOne({
      task_id,
      workspace_id: req.workspace.workspace_id
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    // Compute fractional LexoRank between previous and next card
    const computedPosition = LexoRank.getBetween(prev_position || null, next_position || null);

    task.position = computedPosition;
    if (target_status) task.status = target_status;
    if (target_section_id !== undefined) task.section_id = target_section_id;
    task.updated_at = new Date();

    await task.save();

    res.json({
      success: true,
      message: 'Task repositioned successfully.',
      data: {
        task_id: task.task_id,
        new_position: computedPosition,
        status: task.status,
        section_id: task.section_id
      }
    });
  } catch (err) {
    console.error('Error reordering task:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/iams/workspaces/:workspace_id/tasks/:task_id
 * Update task attributes
 */
router.put('/:workspace_id/tasks/:task_id', async (req, res) => {
  try {
    const { task_id } = req.params;
    const updates = req.body;

    const task = await WorkspaceTask.findOneAndUpdate(
      { task_id, workspace_id: req.workspace.workspace_id },
      { $set: updates, updated_at: new Date() },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/iams/workspaces/:workspace_id/tasks/:task_id
 * Delete or soft-archive task
 */
router.delete('/:workspace_id/tasks/:task_id', async (req, res) => {
  try {
    const { task_id } = req.params;
    await WorkspaceTask.findOneAndDelete({
      task_id,
      workspace_id: req.workspace.workspace_id
    });

    res.json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
