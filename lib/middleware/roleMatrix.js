/**
 * RBAC Role Matrix — Centralized Permission Engine
 * 
 * Implements the Role Matrix from the ICEBERG RBAC specification:
 * 
 *   CEO              → Full Access everywhere, Admin & Billing on internal
 *   CreativeDirector  → Full Access to clients, Manage Boards/Docs on internal
 *   MarketingManager  → Full Access to clients, Manage Boards/Docs on internal
 *   ClientGuest        → Scoped project access only via client_members junction
 * 
 * Backward-compatible mapping for legacy roles:
 *   SUPER_ADMIN      → CEO
 *   ACCOUNT_MANAGER  → CreativeDirector
 *   SPECIALIST       → MarketingManager
 *   CLIENT_VIEWER    → ClientGuest
 */

// ── Role Hierarchy (higher number = more authority) ──────────────────────────
const ROLE_HIERARCHY = {
  CEO:               10,
  CreativeDirector:   8,
  MarketingManager:   6,
  ClientGuest:        2,

  // Legacy mappings (same privilege level)
  SUPER_ADMIN:       10,
  ACCOUNT_MANAGER:    8,
  SPECIALIST:         6,
  CLIENT_VIEWER:      2,
  ADMIN:             10,
  MEMBER:             6,
  GUEST:              2
};

// ── Legacy → New Role Mapping ────────────────────────────────────────────────
const ROLE_MAP = {
  SUPER_ADMIN:     'CEO',
  ACCOUNT_MANAGER: 'CreativeDirector',
  SPECIALIST:      'MarketingManager',
  CLIENT_VIEWER:   'ClientGuest',
  ADMIN:           'CEO',
  MEMBER:          'MarketingManager',
  GUEST:           'ClientGuest'
};

/**
 * Normalize any role string (old or new) to the canonical new role name.
 * @param {string} role
 * @returns {string} — One of: CEO, CreativeDirector, MarketingManager, ClientGuest
 */
function normalizeRole(role) {
  if (!role) return 'ClientGuest';
  if (['CEO', 'CreativeDirector', 'MarketingManager', 'ClientGuest'].includes(role)) return role;
  return ROLE_MAP[role] || 'ClientGuest';
}

// ── Feature Permission Matrix ────────────────────────────────────────────────
const PERMISSIONS = {
  CEO: {
    allClientSpaces:      'FULL',
    internalWorkspace:    'ADMIN_BILLING',
    taskReorder:          true,
    taskAssign:           true,
    clientPortalInvite:   'FULL',
    manageDocs:           true,
    manageAssets:         true,
    deleteTasks:          true,
    viewBilling:          true,
    manageMembers:        true,
    deleteProjects:       true
  },
  CreativeDirector: {
    allClientSpaces:      'FULL',
    internalWorkspace:    'MANAGE_BOARDS_DOCS',
    taskReorder:          true,
    taskAssign:           'DESIGN_CREATIVE',
    clientPortalInvite:   'VIEW_GUESTS',
    manageDocs:           true,
    manageAssets:         true,
    deleteTasks:          false,
    viewBilling:          false,
    manageMembers:        false,
    deleteProjects:       false
  },
  MarketingManager: {
    allClientSpaces:      'FULL',
    internalWorkspace:    'MANAGE_BOARDS_DOCS',
    taskReorder:          true,
    taskAssign:           'MARKETING_DEV',
    clientPortalInvite:   'VIEW_GUESTS',
    manageDocs:           true,
    manageAssets:         true,
    deleteTasks:          false,
    viewBilling:          false,
    manageMembers:        false,
    deleteProjects:       false
  },
  ClientGuest: {
    allClientSpaces:      'NONE',
    internalWorkspace:    'NONE',
    taskReorder:          false,
    taskAssign:           false,
    clientPortalInvite:   'NONE',
    manageDocs:           false,
    manageAssets:         false,
    deleteTasks:          false,
    viewBilling:          false,
    manageMembers:        false,
    deleteProjects:       false
  }
};

/**
 * Check if a role has a specific permission.
 * @param {string} role — raw role string (old or new)
 * @param {string} feature — key from PERMISSIONS (e.g. 'viewBilling')
 * @returns {boolean|string} — true/false or a string value like 'FULL', 'VIEW_GUESTS'
 */
function hasPermission(role, feature) {
  const canonical = normalizeRole(role);
  const perms = PERMISSIONS[canonical];
  if (!perms) return false;
  return perms[feature] !== undefined ? perms[feature] : false;
}

/**
 * Get the numeric hierarchy level for a role.
 * @param {string} role
 * @returns {number}
 */
function getRoleLevel(role) {
  return ROLE_HIERARCHY[role] || ROLE_HIERARCHY[normalizeRole(role)] || 0;
}

// ── Express Middleware Factories ─────────────────────────────────────────────

/**
 * Middleware: Require that the authenticated user has at least `minRole` privilege.
 * Uses numeric hierarchy comparison.
 * 
 * Usage: router.delete('/tasks/:id', authorizeMinRole('CEO'), handler);
 */
function authorizeMinRole(minRole) {
  const minLevel = getRoleLevel(minRole);
  return (req, res, next) => {
    const userRole = req.user?.role || 'ClientGuest';
    const userLevel = getRoleLevel(userRole);

    if (userLevel >= minLevel) return next();

    return res.status(403).json({
      success: false,
      error: `This action requires at least ${minRole} privileges. Your role: ${normalizeRole(userRole)}`
    });
  };
}

/**
 * Middleware: Require that the authenticated user has a specific feature permission.
 * 
 * Usage: router.get('/billing', checkPermission('viewBilling'), handler);
 */
function checkPermission(feature) {
  return (req, res, next) => {
    const userRole = req.user?.role || 'ClientGuest';
    const perm = hasPermission(userRole, feature);

    if (perm && perm !== 'NONE') return next();

    return res.status(403).json({
      success: false,
      error: `Permission denied: '${feature}' is not available for role ${normalizeRole(userRole)}.`
    });
  };
}

module.exports = {
  ROLE_HIERARCHY,
  ROLE_MAP,
  PERMISSIONS,
  normalizeRole,
  hasPermission,
  getRoleLevel,
  authorizeMinRole,
  checkPermission
};
