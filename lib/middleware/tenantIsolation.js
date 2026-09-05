const { Workspace } = require('../models/Workspace');
const { normalizeRole, getRoleLevel } = require('./roleMatrix');

// Lazy-load ClientMember to avoid circular dependency issues
let ClientMember = null;
function getClientMember() {
  if (!ClientMember) {
    try { ClientMember = require('../models/ClientMember'); } catch (e) { /* not critical */ }
  }
  return ClientMember;
}

/**
 * Map RBAC roles to workspace membership levels.
 */
function mapRoleToWorkspaceLevel(role) {
  const canonical = normalizeRole(role);
  switch (canonical) {
    case 'CEO':              return 'ADMIN';
    case 'CreativeDirector': return 'ADMIN';
    case 'MarketingManager': return 'MEMBER';
    case 'ClientGuest':      return 'GUEST';
    default:                 return 'MEMBER';
  }
}

/**
 * Tenant & Workspace Isolation Middleware
 * Resolves current workspace, checks membership, and enforces guest project scoping.
 */
const resolveWorkspace = async (req, res, next) => {
  try {
    const workspaceId =
      req.headers['x-workspace-id'] ||
      req.query.workspace_id ||
      req.params.workspace_id ||
      (req.body && req.body.workspace_id);

    const userId = req.user?.user_id || req.user?._id || req.clientUser?.client_id || 'usr_demo_admin';
    const userRole = req.user?.role || 'ClientGuest';

    let workspace = null;

    if (workspaceId) {
      workspace = await Workspace.findOne({
        $or: [{ workspace_id: workspaceId }, { _id: workspaceId.match(/^[0-9a-fA-F]{24}$/) ? workspaceId : null }]
      });
    }

    // If no workspace explicitly requested, fetch the user's primary/default or first workspace
    if (!workspace) {
      workspace = await Workspace.findOne({
        $or: [
          { owner_user_id: userId },
          { 'members.user_id': userId },
          { is_default: true }
        ]
      });
    }

    // Fallback: If no workspace in DB yet, create or provide demo default context
    if (!workspace) {
      const wsRole = mapRoleToWorkspaceLevel(userRole);
      req.workspace = {
        workspace_id: 'ws_default_iceberg',
        name: 'ICEBERG Master Workspace',
        owner_user_id: userId,
        members: [{ user_id: userId, role: wsRole, assigned_projects: [] }]
      };
      req.workspaceMembership = req.workspace.members[0];
      return next();
    }

    // Check membership & role
    const roleLevel = getRoleLevel(userRole);
    const isHighRole = roleLevel >= 8; // CEO or CreativeDirector get owner-like access
    const isOwner = workspace.owner_user_id === userId || req.user?.role === 'SUPER_ADMIN' || isHighRole;
    const member = workspace.members.find(m => m.user_id === userId);

    if (!isOwner && !member && !req.clientUser) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You are not a member of this workspace.'
      });
    }

    req.workspace = workspace;
    req.workspaceMembership = member || {
      user_id: userId,
      role: isOwner ? 'ADMIN' : mapRoleToWorkspaceLevel(userRole),
      assigned_projects: []
    };

    // For ClientGuest: load allowed projects from ClientMember junction
    const canonical = normalizeRole(userRole);
    if (canonical === 'ClientGuest' && !req.workspaceMembership.assigned_projects?.length) {
      const CM = getClientMember();
      if (CM) {
        try {
          const memberships = await CM.find({ user_id: userId });
          if (memberships.length) {
            req.workspaceMembership.assigned_projects = memberships.map(m => m.client_id);
          }
        } catch (e) { /* non-critical */ }
      }
    }

    next();
  } catch (err) {
    console.error('Tenant isolation middleware error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify workspace permissions.'
    });
  }
};

/**
 * Enforce minimum workspace role (e.g. 'ADMIN', 'MEMBER')
 */
const requireWorkspaceRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.workspaceMembership) {
      return res.status(403).json({ success: false, error: 'No workspace context established.' });
    }

    const currentRole = req.workspaceMembership.role;
    const userRole = req.user?.role;
    const roleLevel = getRoleLevel(userRole);
    const isOwner = req.workspace?.owner_user_id === req.user?.user_id || roleLevel >= 10;

    if (isOwner || allowedRoles.includes(currentRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Action requires one of the following workspace roles: ${allowedRoles.join(', ')}. Current role: ${currentRole}`
    });
  };
};

/**
 * Enforces strict project isolation for GUEST / CLIENT_VIEWER / ClientGuest users
 */
const scopedProjectAccess = (paramName = 'project_id') => {
  return (req, res, next) => {
    const role = req.workspaceMembership?.role;
    const canonical = normalizeRole(req.user?.role);

    // Admins and standard members have workspace-wide project view
    if (role !== 'GUEST' && role !== 'CLIENT_VIEWER' && canonical !== 'ClientGuest') {
      return next();
    }

    const projectId =
      req.params[paramName] ||
      req.query[paramName] ||
      (req.body && req.body[paramName]);

    if (!projectId) {
      return next();
    }

    const allowedProjects = req.workspaceMembership?.assigned_projects || [];
    if (!allowedProjects.includes(projectId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Guest access is strictly restricted to assigned project lists.'
      });
    }

    next();
  };
};

module.exports = {
  resolveWorkspace,
  requireWorkspaceRole,
  scopedProjectAccess,
  mapRoleToWorkspaceLevel
};

