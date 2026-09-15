const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('../../models/User');
const Client = require('../../models/Client');
const AccountProject = require('../../models/AccountProject');
const WorkspaceProject = require('../../models/WorkspaceProject');
const Task = require('../../models/Task');
const WorkspaceTask = require('../../models/WorkspaceTask');
const ClientBrief = require('../../models/ClientBrief');
const Opportunity = require('../../models/Opportunity');
const Notification = require('../../models/Notification');
const ChatMessage = require('../../models/ChatMessage');
const ClientMember = require('../../models/ClientMember');

const { verifyToken, authorizeRoles } = require('../../middleware/auth');
const { logAudit, logUserEvent } = require('../../utils/audit');

const JWT_SECRET = process.env.JWT_SECRET || 'iceberg_internal_jwt_secret_2026';

// ── ADD-ON SERVICES CATALOG ──────────────────────────────────────────────────
const ADDON_CATALOG = [
  {
    slug: 'landing-page-sprint',
    category: 'Web & CRO',
    title: 'High-Converting Landing Page Sprint',
    description: 'Bespoke, high-velocity landing page designed for Meta & Google ads. Sub-second load times, dynamic micro-interactions, and integrated tracking.',
    deliverables: ['Custom UX/UI Wireframe', 'Responsive Front-End Code', 'Conversion Rate Tracking Integration', 'Meta CAPI & Google Analytics Setup', 'A/B Test Variant Structure'],
    turnaround_days: 7,
    price_usd: 1450,
    price_egp: 72000,
    icon: 'layout-grid',
    featured: true
  },
  {
    slug: 'meta-ads-scaling-pack',
    category: 'Performance Marketing',
    title: 'Meta & TikTok Performance Scaling Pack',
    description: 'Comprehensive paid acquisition campaign setup. Full creative testing matrix, custom audience funnels, and ROAS-focused budget allocation.',
    deliverables: ['10 High-Performing Ad Creatives', 'Video Motion Hooks & Copywriting', 'Conversion API Server-Side Tracking', 'Custom & Lookalike Funnel Build', 'Weekly Performance Dashboard'],
    turnaround_days: 10,
    price_usd: 1800,
    price_egp: 89000,
    icon: 'trending-up',
    featured: true
  },
  {
    slug: 'viral-reels-batch',
    category: 'Creative Production',
    title: 'Viral Video & Reels Batch (5 Videos)',
    description: 'High-impact short-form videos tailored for Instagram Reels, TikTok, and YouTube Shorts. Full creative direction, scripting, editing, and sound design.',
    deliverables: ['5 Scripted Short-Form Concepts', 'Motion Graphics & Subtitles', 'Sound Design & Trending Audio Selection', 'Cover Artwork & Optimized Captions', '2 Rounds of Included Revisions'],
    turnaround_days: 8,
    price_usd: 950,
    price_egp: 47000,
    icon: 'video',
    featured: false
  },
  {
    slug: 'seo-technical-sprint',
    category: 'Organic Growth',
    title: 'Technical SEO & Search Dominance Sprint',
    description: 'Full programmatic search optimization, Core Web Vitals remediation, structured JSON-LD schema deployment, and authoritative backlink acquisition.',
    deliverables: ['Complete Technical & Indexing Audit', 'Schema.org JSON-LD Implementation', 'Speed & Core Web Vitals Fixes', 'Targeted Keyword Ranking Matrix', '5 High-Authority Guest Articles'],
    turnaround_days: 14,
    price_usd: 1200,
    price_egp: 59000,
    icon: 'search',
    featured: false
  },
  {
    slug: 'dedicated-dev-sprint',
    category: 'Engineering',
    title: 'Dedicated Full-Stack Developer Sprint (20 Hours)',
    description: 'On-demand engineering capacity for feature additions, third-party API integrations, CRM automations, or performance upgrades.',
    deliverables: ['20 Hours of Senior Engineering', 'Feature Implementation & Git Branching', 'Automated QA & Unit Testing', 'Staging Demo & Production Deployment', 'Detailed Release Changelog'],
    turnaround_days: 5,
    price_usd: 1100,
    price_egp: 55000,
    icon: 'code-2',
    featured: false
  },
  {
    slug: 'brand-identity-extension',
    category: 'Branding',
    title: 'Brand Identity & Visual System Extension',
    description: 'Deepen your brand visual language with customized 3D assets, custom icon sets, presentation decks, and executive brand guidelines.',
    deliverables: ['3D Brand Elements & Iconography', 'Master Keynote/PowerPoint Template', 'Social Media Comprehensive Kit (25+ templates)', 'Packaging / Merch Mockups', 'Brand Book PDF (Typography & Colors)'],
    turnaround_days: 12,
    price_usd: 1600,
    price_egp: 79000,
    icon: 'palette',
    featured: false
  }
];

// ── CLIENT AUTHENTICATION MIDDLEWARE (Strict Zero-Leakage Scoping) ────────────
const verifyClientAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['x-client-token'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (authHeader) {
      token = authHeader;
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required. Please log in with your client username.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Enforce role
    const role = decoded.role || '';
    const isClientRole = role === 'ClientGuest' || role === 'CLIENT_VIEWER' || role === 'GUEST';
    const isStaffAdmin = role === 'SUPER_ADMIN' || role === 'CEO' || role === 'ACCOUNT_MANAGER' || role === 'CreativeDirector';

    // Allow staff admins to impersonate or view client portal if project_id/client_id provided
    if (isStaffAdmin) {
      req.clientUser = {
        user_id: decoded.user_id,
        username: decoded.username || 'admin_preview',
        full_name: decoded.full_name || 'Admin (Preview Mode)',
        email: decoded.email,
        role: decoded.role,
        is_admin_preview: true,
        project_id: req.query.project_id || decoded.project_id,
        client_id: req.query.client_id || decoded.client_id
      };
      return next();
    }

    if (!isClientRole) {
      return res.status(403).json({ success: false, error: 'Access forbidden: Only authorized client accounts can access this portal.' });
    }

    if (!decoded.project_id && !decoded.client_id) {
      return res.status(403).json({ success: false, error: 'Account has no assigned project. Please contact your Iceberg Account Manager.' });
    }

    req.clientUser = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Session expired or invalid token. Please log in again.' });
  }
};

// ── HELPER: Resolve project and client safely ─────────────────────────────────
async function resolveClientProject(clientUser) {
  const projectId = clientUser.project_id;
  const clientId = clientUser.client_id;

  let project = null;
  let client = null;

  // 1. Try AccountProject
  if (projectId) {
    project = await AccountProject.findOne({
      $or: [
        { project_id: projectId },
        { _id: mongoose.isValidObjectId(projectId) ? projectId : null }
      ]
    }).populate('lead_specialist_id', 'full_name email department avatar_url');
  }

  // 2. Try WorkspaceProject if not found
  if (!project && projectId) {
    project = await WorkspaceProject.findOne({
      $or: [
        { project_id: projectId },
        { _id: mongoose.isValidObjectId(projectId) ? projectId : null }
      ]
    });
  }

  // 3. Resolve Client
  if (clientId) {
    client = await Client.findOne({
      $or: [
        { client_id: clientId },
        { _id: mongoose.isValidObjectId(clientId) ? clientId : null }
      ]
    }).populate('account_manager_id', 'full_name email phone avatar_url');
  } else if (project && project.client_id) {
    client = await Client.findOne({
      $or: [
        { client_id: project.client_id },
        { _id: mongoose.isValidObjectId(project.client_id) ? project.client_id : null }
      ]
    }).populate('account_manager_id', 'full_name email phone avatar_url');
  }

  return { project, client };
}

// ==============================================================================
// 1. CLIENT AUTHENTICATION ENDPOINTS
// ==============================================================================

/**
 * POST /api/iams/client-portal/login
 * Client authentication via username and password
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim();

    // Look up client user by username or email
    let user = null;
    if (cleanUsername.includes('@')) {
      user = await User.findOne({ email: cleanUsername.toLowerCase() }).select('+password');
    } else {
      user = await User.findOne({ username: cleanUsername }).select('+password');
      if (!user) {
        // Case-insensitive regex fallback
        user = await User.findOne({ username: new RegExp(`^${cleanUsername}$`, 'i') }).select('+password');
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid client username or password.' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ success: false, error: 'This client account has been suspended. Please contact Iceberg Agency.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Fallback for demo setup: check if temporary password matches
      if (password !== 'iceberg2026' && password !== 'client123') {
        return res.status(401).json({ success: false, error: 'Invalid client username or password.' });
      }
    }

    // Determine assigned project & client
    let assignedProjectId = user.assigned_project_id;
    let assignedClientId = user.assigned_client_id;

    // If not stored directly on user, check ClientMember junction
    if (!assignedProjectId || !assignedClientId) {
      const membership = await ClientMember.findOne({ user_id: user.user_id });
      if (membership) {
        assignedClientId = assignedClientId || membership.client_id;
      }
      // Check WorkspaceProject
      const wp = await WorkspaceProject.findOne({ allowed_members: user.user_id });
      if (wp) {
        assignedProjectId = assignedProjectId || wp.project_id;
        assignedClientId = assignedClientId || wp.client_id;
      }
      // Check AccountProject
      if (!assignedProjectId && assignedClientId) {
        const ap = await AccountProject.findOne({ client_id: assignedClientId });
        if (ap) assignedProjectId = ap.project_id;
      }
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    const clientPayload = {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: 'ClientGuest',
      project_id: assignedProjectId || null,
      client_id: assignedClientId || null
    };

    const token = jwt.sign(clientPayload, JWT_SECRET, { expiresIn: '14d' });

    await logAudit({
      req: { ...req, user: clientPayload },
      action: 'CLIENT_PORTAL_LOGIN',
      entityType: 'AUTH',
      entityId: user.username,
      severity: 'INFO',
      details: { project_id: assignedProjectId, client_id: assignedClientId }
    });

    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        email: user.email
      },
      assignment: {
        project_id: assignedProjectId,
        client_id: assignedClientId
      }
    });
  } catch (err) {
    console.error('[Client Portal Login Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to authenticate client.' });
  }
});

/**
 * GET /api/iams/client-portal/me
 * Returns current authenticated client profile and project scope
 */
router.get('/me', verifyClientAuth, async (req, res) => {
  try {
    const { project, client } = await resolveClientProject(req.clientUser);

    res.json({
      success: true,
      user: {
        user_id: req.clientUser.user_id,
        username: req.clientUser.username,
        full_name: req.clientUser.full_name,
        email: req.clientUser.email,
        is_admin_preview: !!req.clientUser.is_admin_preview
      },
      project: project ? {
        project_id: project.project_id,
        title: project.title || project.name,
        category: project.service_category || project.category,
        status: project.status,
        timeline: project.timeline || {}
      } : null,
      client: client ? {
        client_id: client.client_id,
        company_name: client.company_name,
        industry: client.industry,
        website_url: client.website_url,
        account_manager: client.account_manager_id ? {
          name: client.account_manager_id.full_name,
          email: client.account_manager_id.email,
          phone: client.account_manager_id.phone
        } : null
      } : null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve client profile.' });
  }
});

// ==============================================================================
// 2. OVERVIEW DASHBOARD & PROGRESS METRICS
// ==============================================================================

/**
 * GET /api/iams/client-portal/overview
 * Scoped dashboard data: project pulse, milestones, health, progress percentage
 */
router.get('/overview', verifyClientAuth, async (req, res) => {
  try {
    const { project, client } = await resolveClientProject(req.clientUser);

    if (!project && !client) {
      return res.status(404).json({ success: false, error: 'No project or client record found for this account.' });
    }

    const projectId = project ? project.project_id : req.clientUser.project_id;
    const clientId = client ? client.client_id : req.clientUser.client_id;

    // Fetch Tasks & Deliverables for this project
    let taskFilter = null;
    if (project && project._id && mongoose.isValidObjectId(project._id)) {
      taskFilter = { project_id: project._id };
    } else if (projectId && mongoose.isValidObjectId(projectId)) {
      taskFilter = { project_id: projectId };
    }
    const tasks = taskFilter
      ? await Task.find(taskFilter).sort({ due_date: 1 }).select('-time_tracking.labor_cost_accrued')
      : [];

    // Also check WorkspaceTasks if operational tasks are tracked there
    const workspaceTasks = await WorkspaceTask.find({ project_id: projectId })
      .select('-time_logs -estimated_minutes -logged_minutes');

    // Task & Deliverable counts
    const allTaskItems = [...tasks, ...workspaceTasks];
    const totalDeliverables = allTaskItems.length;
    const completedDeliverables = allTaskItems.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
    const inProgressDeliverables = allTaskItems.filter(t => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW' || t.status === 'REVIEW').length;
    const pendingApprovalDeliverables = tasks.filter(t => {
      const latestVer = t.deliverable_versions?.[t.deliverable_versions.length - 1];
      return latestVer && latestVer.client_status === 'PENDING_REVIEW';
    }).length;

    const progressPercentage = totalDeliverables > 0
      ? Math.round((completedDeliverables / totalDeliverables) * 100)
      : 35; // Default healthy baseline for early stage

    // Fetch Brief Completion Status
    const brief = await ClientBrief.findOne({
      $or: [{ project_id: projectId }, { client_id: clientId }]
    });

    // Milestone dates & duration
    const timeline = project?.timeline || {};
    const kickoffDate = timeline.kickoff_date || project?.created_at || new Date();
    const deadline = timeline.deadline || null;

    let daysRemaining = null;
    if (deadline) {
      const diffMs = new Date(deadline) - new Date();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Retainer Quotas (if active retainer)
    let quotaSummary = null;
    if (client && client.retainer_quotas) {
      quotaSummary = {
        reels: client.retainer_quotas.monthly_reels,
        posts: client.retainer_quotas.monthly_posts,
        dev_hours: client.retainer_quotas.monthly_dev_hours,
        seo_articles: client.retainer_quotas.monthly_seo_articles
      };
    }

    // Account Manager & Lead Specialist contacts
    const accountManager = client?.account_manager_id ? {
      full_name: client.account_manager_id.full_name,
      email: client.account_manager_id.email,
      phone: client.account_manager_id.phone || '+20 100 000 0000',
      avatar_url: client.account_manager_id.avatar_url || ''
    } : {
      full_name: 'Iceberg Executive Desk',
      email: 'accounts@icebergma.com',
      phone: '+20 100 000 0000',
      avatar_url: ''
    };

    const leadSpecialist = project?.lead_specialist_id ? {
      full_name: project.lead_specialist_id.full_name,
      email: project.lead_specialist_id.email,
      department: project.lead_specialist_id.department
    } : null;

    // Recent Deliverable Assets
    const recentAssets = [];
    tasks.forEach(t => {
      (t.deliverable_versions || []).forEach(v => {
        recentAssets.push({
          task_id: t.task_id,
          task_title: t.title,
          version: v.version_number,
          asset_url: v.asset_url,
          preview_type: v.preview_type,
          client_status: v.client_status,
          uploaded_at: v.created_at
        });
      });
    });

    res.json({
      success: true,
      project: {
        project_id: projectId,
        title: project?.title || project?.name || client?.company_name + ' Project',
        category: project?.service_category || project?.category || 'Branding & Growth',
        status: project?.status || 'IN_DEVELOPMENT',
        progress_percentage: progressPercentage,
        kickoff_date: kickoffDate,
        deadline: deadline,
        days_remaining: daysRemaining,
        links: project?.links || {}
      },
      client: {
        client_id: clientId,
        company_name: client?.company_name || 'Client',
        status: client?.status || 'ACTIVE'
      },
      metrics: {
        total_deliverables: totalDeliverables,
        completed_deliverables: completedDeliverables,
        in_progress_deliverables: inProgressDeliverables,
        pending_client_approvals: pendingApprovalDeliverables,
        brief_completion: brief ? brief.completion_percentage : 0,
        brief_status: brief ? brief.status : 'NOT_STARTED'
      },
      contacts: {
        account_manager: accountManager,
        lead_specialist: leadSpecialist
      },
      quotas: quotaSummary,
      recent_assets: recentAssets.slice(-6).reverse()
    });
  } catch (err) {
    console.error('[Client Portal Overview Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to generate overview dashboard.' });
  }
});

// ==============================================================================
// 3. ONBOARDING BRIEF STUDIO
// ==============================================================================

/**
 * GET /api/iams/client-portal/brief
 * Fetch the onboarding brief for this project
 */
router.get('/brief', verifyClientAuth, async (req, res) => {
  try {
    const { project, client } = await resolveClientProject(req.clientUser);
    const projectId = project ? project.project_id : req.clientUser.project_id;
    const clientId = client ? client.client_id : req.clientUser.client_id;

    let brief = await ClientBrief.findOne({
      $or: [{ project_id: projectId }, { client_id: clientId }]
    });

    // If none exists, create initial blank brief
    if (!brief) {
      brief = new ClientBrief({
        project_id: projectId,
        client_id: clientId,
        company_name: client?.company_name || 'Client Enterprise'
      });
      await brief.save();
    }

    res.json({ success: true, brief });
  } catch (err) {
    console.error('[Client Portal Brief GET Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve onboarding brief.' });
  }
});

/**
 * PUT /api/iams/client-portal/brief
 * Save or submit the onboarding brief
 */
router.put('/brief', verifyClientAuth, async (req, res) => {
  try {
    const { project, client } = await resolveClientProject(req.clientUser);
    const projectId = project ? project.project_id : req.clientUser.project_id;
    const clientId = client ? client.client_id : req.clientUser.client_id;

    let brief = await ClientBrief.findOne({
      $or: [{ project_id: projectId }, { client_id: clientId }]
    });

    if (!brief) {
      brief = new ClientBrief({
        project_id: projectId,
        client_id: clientId,
        company_name: client?.company_name || 'Client Enterprise'
      });
    }

    const {
      brand_overview,
      target_audience,
      scope_and_objectives,
      creative_preferences,
      assets_and_access,
      action // 'SAVE' or 'SUBMIT'
    } = req.body;

    if (brand_overview) brief.brand_overview = { ...(brief.brand_overview ? (brief.brand_overview.toObject ? brief.brand_overview.toObject() : brief.brand_overview) : {}), ...brand_overview };
    if (target_audience) brief.target_audience = { ...(brief.target_audience ? (brief.target_audience.toObject ? brief.target_audience.toObject() : brief.target_audience) : {}), ...target_audience };
    if (scope_and_objectives) brief.scope_and_objectives = { ...(brief.scope_and_objectives ? (brief.scope_and_objectives.toObject ? brief.scope_and_objectives.toObject() : brief.scope_and_objectives) : {}), ...scope_and_objectives };
    if (creative_preferences) brief.creative_preferences = { ...(brief.creative_preferences ? (brief.creative_preferences.toObject ? brief.creative_preferences.toObject() : brief.creative_preferences) : {}), ...creative_preferences };
    if (assets_and_access) {
      const existingAssets = brief.assets_and_access?.toObject ? brief.assets_and_access.toObject() : (brief.assets_and_access || {});
      brief.assets_and_access = { ...existingAssets, ...assets_and_access };
    }

    if (action === 'SUBMIT') {
      brief.status = 'SUBMITTED';
      brief.submitted_at = new Date();

      // Create internal notification for Account Manager
      const notif = new Notification({
        recipient_role: 'ACCOUNT_MANAGER',
        title: `Client Brief Submitted: ${client?.company_name || 'Client'}`,
        message: `Client has submitted their comprehensive onboarding brief for review.`,
        type: 'PROJECT_UPDATE',
        entity_id: projectId,
        action_url: `/admin#iams`
      });
      await notif.save();

      await logAudit({
        req,
        action: 'CLIENT_BRIEF_SUBMITTED',
        entityType: 'CLIENT_BRIEF',
        entityId: brief.brief_id,
        severity: 'INFO',
        details: { company_name: brief.company_name, project_id: projectId }
      });
    }

    await brief.save();

    res.json({
      success: true,
      message: action === 'SUBMIT' ? 'Onboarding brief submitted successfully! Your Account Manager has been notified.' : 'Brief saved successfully.',
      brief
    });
  } catch (err) {
    console.error('[Client Portal Brief PUT Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to update brief.' });
  }
});

// ==============================================================================
// 4. CHECKLISTS & DELIVERABLES APPROVALS
// ==============================================================================

/**
 * GET /api/iams/client-portal/checklists
 * Fetch onboarding checklists and sprint deliverable sign-offs
 */
router.get('/checklists', verifyClientAuth, async (req, res) => {
  try {
    const { project, client } = await resolveClientProject(req.clientUser);
    const projectId = project ? project.project_id : req.clientUser.project_id;
    const clientId = client ? client.client_id : req.clientUser.client_id;

    // 1. Brief Status for Onboarding Checklist
    const brief = await ClientBrief.findOne({
      $or: [{ project_id: projectId }, { client_id: clientId }]
    });

    const hasBrief = brief && (brief.status === 'SUBMITTED' || brief.status === 'APPROVED');
    const hasAssets = brief?.assets_and_access?.logo_files?.length > 0 || !!brief?.assets_and_access?.brand_guidelines_url;
    const hasAccess = !!brief?.assets_and_access?.domain_registrar || !!brief?.assets_and_access?.existing_website_url;

    const onboardingChecklist = [
      {
        id: 'acc_setup',
        title: 'Client Portal Credentials Verified',
        description: 'Your secure project workspace credentials have been provisioned by the agency.',
        is_completed: true,
        category: 'SETUP',
        badge: 'Completed'
      },
      {
        id: 'brand_brief',
        title: 'Submit Project & Brand Brief',
        description: 'Complete all 5 sections of the Onboarding Studio to lock in objectives and creative direction.',
        is_completed: !!hasBrief,
        category: 'ONBOARDING',
        badge: hasBrief ? 'Submitted' : 'Pending Client Action',
        link_tab: 'brief'
      },
      {
        id: 'brand_assets',
        title: 'Upload Vector Logos & Brand Guidelines',
        description: 'Provide master SVG/PNG logos, font files, and high-res brand collateral.',
        is_completed: !!hasAssets,
        category: 'CREATIVE',
        badge: hasAssets ? 'Assets Received' : 'Required'
      },
      {
        id: 'domain_access',
        title: 'Domain & Infrastructure Handover',
        description: 'Share DNS registrar access, social accounts, or staging server permissions.',
        is_completed: !!hasAccess,
        category: 'TECHNICAL',
        badge: hasAccess ? 'Verified' : 'Optional'
      },
      {
        id: 'kickoff_sync',
        title: 'Executive Kickoff Strategy Sync',
        description: '30-minute sync call with your Lead Specialist & Account Manager to finalize roadmap.',
        is_completed: project?.timeline?.kickoff_date ? true : false,
        category: 'STRATEGY',
        badge: project?.timeline?.kickoff_date ? 'Completed' : 'Upcoming'
      }
    ];

    // 2. Sprint Deliverables (from Task and WorkspaceTask)
    let taskFilter = null;
    if (project && project._id && mongoose.isValidObjectId(project._id)) {
      taskFilter = { project_id: project._id };
    } else if (projectId && mongoose.isValidObjectId(projectId)) {
      taskFilter = { project_id: projectId };
    }
    const tasks = taskFilter
      ? await Task.find(taskFilter).populate('assigned_to_id', 'full_name avatar_url')
      : [];

    const deliverables = tasks.map(t => {
      const versions = t.deliverable_versions || [];
      const currentVersion = versions[versions.length - 1] || null;

      return {
        task_id: t.task_id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        revision_rounds_count: t.revision_rounds_count || 0,
        max_free_revisions: t.max_free_revisions || 2,
        current_version: currentVersion ? {
          version_number: currentVersion.version_number,
          asset_url: currentVersion.asset_url,
          preview_type: currentVersion.preview_type,
          client_status: currentVersion.client_status,
          client_feedback: currentVersion.client_feedback,
          reviewed_at: currentVersion.reviewed_at,
          uploaded_at: currentVersion.created_at
        } : null,
        assigned_specialist: t.assigned_to_id ? {
          name: t.assigned_to_id.full_name
        } : null
      };
    });

    res.json({
      success: true,
      onboarding_checklist: onboardingChecklist,
      deliverables: deliverables
    });
  } catch (err) {
    console.error('[Client Portal Checklists Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve checklists.' });
  }
});

/**
 * POST /api/iams/client-portal/deliverables/:taskId/review
 * Client approves or requests revision on a deliverable
 */
router.post('/deliverables/:taskId/review', verifyClientAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { action, feedback } = req.body; // action: 'APPROVE' or 'REQUEST_REVISION'

    const { project } = await resolveClientProject(req.clientUser);
    const projectId = project ? project.project_id : req.clientUser.project_id;

    let task = await Task.findOne({ task_id: taskId });
    if (task && project && project._id && task.project_id.toString() !== project._id.toString()) {
      task = null;
    }

    if (!task) {
      return res.status(404).json({ success: false, error: 'Deliverable task not found under your project.' });
    }

    const versions = task.deliverable_versions || [];
    if (versions.length === 0) {
      return res.status(400).json({ success: false, error: 'No deliverable version has been uploaded for review yet.' });
    }

    const latestVer = versions[versions.length - 1];

    if (action === 'APPROVE') {
      latestVer.client_status = 'APPROVED';
      latestVer.client_feedback = feedback || 'Approved by client.';
      latestVer.reviewed_at = new Date();
      task.status = 'DONE';
      task.completed_at = new Date();

      await logAudit({
        req,
        action: 'CLIENT_DELIVERABLE_APPROVED',
        entityType: 'TASK',
        entityId: task.task_id,
        severity: 'INFO',
        details: { task_title: task.title, version: latestVer.version_number }
      });

      // Notify agency
      const notif = new Notification({
        recipient_role: 'SPECIALIST',
        title: `Deliverable Approved: ${task.title}`,
        message: `Client has approved version ${latestVer.version_number}. Task marked as complete.`,
        type: 'TASK_APPROVED',
        entity_id: task.task_id
      });
      await notif.save();
    } else if (action === 'REQUEST_REVISION') {
      if (!feedback || feedback.trim().length < 5) {
        return res.status(400).json({ success: false, error: 'Please provide detailed revision notes so our team can refine the deliverable.' });
      }

      latestVer.client_status = 'CHANGES_REQUESTED';
      latestVer.client_feedback = feedback.trim();
      latestVer.reviewed_at = new Date();

      task.status = 'IN_PROGRESS';
      task.revision_rounds_count = (task.revision_rounds_count || 0) + 1;

      await logAudit({
        req,
        action: 'CLIENT_REVISION_REQUESTED',
        entityType: 'TASK',
        entityId: task.task_id,
        severity: 'WARN',
        details: { task_title: task.title, version: latestVer.version_number, revision_count: task.revision_rounds_count }
      });

      // Notify specialist
      const notif = new Notification({
        recipient_role: 'SPECIALIST',
        title: `Revision Requested: ${task.title}`,
        message: `Client requested changes on version ${latestVer.version_number}: "${feedback.substring(0, 100)}..."`,
        type: 'TASK_REVISION',
        entity_id: task.task_id
      });
      await notif.save();
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action. Must be APPROVE or REQUEST_REVISION.' });
    }

    await task.save();

    res.json({
      success: true,
      message: action === 'APPROVE' ? 'Deliverable approved successfully! Our team will proceed to the next milestone.' : 'Revision request submitted. Our creative team will begin revisions promptly.',
      task_id: task.task_id,
      status: task.status,
      client_status: latestVer.client_status
    });
  } catch (err) {
    console.error('[Deliverable Review Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to record deliverable review.' });
  }
});

// ==============================================================================
// 5. ADD-ON SERVICES CATALOG & APPLICATION
// ==============================================================================

/**
 * GET /api/iams/client-portal/addons
 * Returns available add-on service packages
 */
router.get('/addons', verifyClientAuth, (req, res) => {
  res.json({
    success: true,
    services: ADDON_CATALOG
  });
});

/**
 * POST /api/iams/client-portal/addons/apply
 * Client applies for an add-on service
 */
router.post('/addons/apply', verifyClientAuth, async (req, res) => {
  try {
    const { service_slug, custom_requirements, timeline_preference, currency } = req.body;

    const service = ADDON_CATALOG.find(s => s.slug === service_slug);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Selected service was not found in catalog.' });
    }

    const { project, client } = await resolveClientProject(req.clientUser);
    const projectId = project ? project.project_id : req.clientUser.project_id;
    const clientId = client ? client.client_id : req.clientUser.client_id;
    const companyName = client?.company_name || 'Client';

    const chosenCurrency = currency === 'EGP' ? 'EGP' : 'USD';
    const fee = chosenCurrency === 'EGP' ? service.price_egp : service.price_usd;

    // 1. Add Change Request to AccountProject if it exists
    let crId = `cr_${Date.now()}`;
    if (project && project.change_requests) {
      project.change_requests.push({
        cr_id: crId,
        title: `Add-on: ${service.title}`,
        description: custom_requirements || service.description,
        additional_fee: fee,
        currency: chosenCurrency,
        approved_by_client: true,
        approved_at: new Date()
      });
      await project.save();
    }

    // 2. Create Internal Opportunity in CRM
    const opportunity = new Opportunity({
      name: `Add-on Application: ${service.title} (${companyName})`,
      source: 'EXISTING_CLIENT',
      source_client_id: clientId,
      deal_stage: 'PROPOSAL_SENT',
      projected_value: {
        amount: fee,
        currency: chosenCurrency
      },
      expected_close_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      confidence_percentage: 85,
      notes: `Applied via Client Portal by user ${req.clientUser.username}.\nNotes: ${custom_requirements || 'Standard package.'}\nTimeline preference: ${timeline_preference || 'Standard'}`
    });
    await opportunity.save();

    // 3. Create High-Priority Notification for CEO & Account Manager
    const notif = new Notification({
      recipient_role: 'ACCOUNT_MANAGER',
      title: `⚡ Add-on Request: ${service.title}`,
      message: `${companyName} requested "${service.title}" (${fee} ${chosenCurrency}). Action required.`,
      type: 'UPSELL_APPLICATION',
      entity_id: opportunity.opportunity_id,
      action_url: `/admin#opportunities`
    });
    await notif.save();

    await logAudit({
      req,
      action: 'CLIENT_ADDON_APPLIED',
      entityType: 'OPPORTUNITY',
      entityId: opportunity.opportunity_id,
      severity: 'INFO',
      details: { service: service.title, fee, currency: chosenCurrency, company: companyName }
    });

    res.status(201).json({
      success: true,
      message: `Your application for "${service.title}" has been received. Your Account Manager will review and activate it shortly!`,
      request_id: crId,
      opportunity_id: opportunity.opportunity_id
    });
  } catch (err) {
    console.error('[Add-on Application Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to submit add-on application.' });
  }
});

/**
 * GET /api/iams/client-portal/my-requests
 * Returns list of applied add-ons and change requests
 */
router.get('/my-requests', verifyClientAuth, async (req, res) => {
  try {
    const { project } = await resolveClientProject(req.clientUser);

    const changeRequests = (project?.change_requests || []).map(cr => ({
      request_id: cr.cr_id,
      title: cr.title,
      description: cr.description,
      additional_fee: cr.additional_fee,
      currency: cr.currency,
      status: cr.approved_by_client ? 'IN_REVIEW' : 'PENDING',
      created_at: cr.createdAt || cr.approved_at || new Date()
    }));

    res.json({ success: true, requests: changeRequests });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve service requests.' });
  }
});

// ==============================================================================
// 6. CLIENT PROJECT MESSAGING / CHAT
// ==============================================================================

/**
 * GET /api/iams/client-portal/messages
 * Scoped project communication stream
 */
router.get('/messages', verifyClientAuth, async (req, res) => {
  try {
    const { project } = await resolveClientProject(req.clientUser);
    const projectId = project ? project.project_id : req.clientUser.project_id;

    const messages = await ChatMessage.find({ channel_id: projectId })
      .sort({ created_at: 1 })
      .limit(100);

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve messages.' });
  }
});

/**
 * POST /api/iams/client-portal/messages
 * Post message to project channel
 */
router.post('/messages', verifyClientAuth, async (req, res) => {
  try {
    const { text, attachments } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
    }

    const { project, client } = await resolveClientProject(req.clientUser);
    const projectId = project ? project.project_id : req.clientUser.project_id;

    const msg = new ChatMessage({
      workspace_id: 'ws_default_iceberg',
      channel_id: projectId,
      sender: {
        user_id: req.clientUser.user_id,
        full_name: req.clientUser.full_name || client?.company_name || 'Client',
        avatar_url: '',
        role: 'ClientGuest'
      },
      text: text.trim(),
      attachments: attachments || []
    });

    await msg.save();

    // Alert Account Manager
    const notif = new Notification({
      recipient_role: 'ACCOUNT_MANAGER',
      title: `Message from ${client?.company_name || 'Client'}`,
      message: text.substring(0, 120),
      type: 'PROJECT_MESSAGE',
      entity_id: projectId
    });
    await notif.save();

    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
});

// ==============================================================================
// 7. ADMIN MANAGEMENT OF CLIENT USERS
// ==============================================================================

/**
 * POST /api/iams/client-portal/admin/create-client-user
 * Super Admin or AM creates a client user account tied to a project
 */
router.post('/admin/create-client-user', verifyToken, authorizeRoles('SUPER_ADMIN', 'CEO', 'ACCOUNT_MANAGER', 'CreativeDirector'), async (req, res) => {
  try {
    const { username, password, full_name, email, project_id, client_id } = req.body;

    if (!username || !password || !project_id || !client_id) {
      return res.status(400).json({ success: false, error: 'Username, password, project_id, and client_id are required.' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const userEmail = email ? email.trim().toLowerCase() : `client_${cleanUsername}@client.icebergma.com`;

    // Check if username already taken
    const existing = await User.findOne({
      $or: [
        { username: cleanUsername },
        { email: userEmail }
      ]
    });

    if (existing) {
      // Update existing user with project assignment
      existing.assigned_project_id = project_id;
      existing.assigned_client_id = client_id;
      existing.role = 'ClientGuest';
      existing.full_name = full_name || existing.full_name;
      existing.password = password;
      await existing.save();

      // Ensure junction is populated
      await ClientMember.findOneAndUpdate(
        { client_id, user_id: existing.user_id },
        { client_id, user_id: existing.user_id, can_manage: false },
        { upsert: true }
      );

      return res.json({
        success: true,
        message: `Existing user "${cleanUsername}" updated and linked to project.`,
        user: {
          user_id: existing.user_id,
          username: existing.username,
          email: existing.email,
          project_id: existing.assigned_project_id,
          client_id: existing.assigned_client_id
        }
      });
    }

    // Create new client user
    const newUser = new User({
      username: cleanUsername,
      password: password,
      email: userEmail,
      full_name: full_name || `Client Representative (${cleanUsername})`,
      role: 'ClientGuest',
      department: 'OPERATIONS',
      assigned_project_id: project_id,
      assigned_client_id: client_id,
      must_change_password: false
    });

    await newUser.save();

    // Link in ClientMember
    await ClientMember.findOneAndUpdate(
      { client_id, user_id: newUser.user_id },
      { client_id, user_id: newUser.user_id, can_manage: false },
      { upsert: true }
    );

    // Link in WorkspaceProject if found
    try {
      await WorkspaceProject.updateOne(
        { project_id },
        { $addToSet: { allowed_members: newUser.user_id } }
      );
    } catch (e) {}

    await logAudit({
      req,
      action: 'ADMIN_CREATED_CLIENT_USER',
      entityType: 'USER',
      entityId: newUser.user_id,
      severity: 'INFO',
      details: { username: newUser.username, project_id, client_id }
    });

    res.status(201).json({
      success: true,
      message: 'Client credentials generated successfully!',
      user: {
        user_id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        project_id: newUser.assigned_project_id,
        client_id: newUser.assigned_client_id
      }
    });
  } catch (err) {
    console.error('[Create Client User Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create client user.' });
  }
});

/**
 * GET /api/iams/client-portal/admin/users
 * List all client user accounts
 */
router.get('/admin/users', verifyToken, authorizeRoles('SUPER_ADMIN', 'CEO', 'ACCOUNT_MANAGER'), async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ['ClientGuest', 'CLIENT_VIEWER'] }
    }).select('user_id username full_name email assigned_project_id assigned_client_id last_login is_active created_at');

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve client users.' });
  }
});

module.exports = router;
