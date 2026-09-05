const jwt = require('jsonwebtoken');
const { normalizeRole, getRoleLevel, authorizeMinRole, checkPermission } = require('./roleMatrix');

/**
 * Verifies JWT token from Authorization Bearer header, x-access-token, or cookie
 */
const verifyToken = (req, res, next) => {
  // Allow demo bypass if in development and query/header specifies demo
  if (process.env.NODE_ENV === 'development' && req.headers['x-demo-admin'] === 'true') {
    req.user = {
      user_id: 'usr_demo_admin',
      email: 'admin@icebergma.com',
      role: 'CEO',
      full_name: 'Executive Super Admin'
    };
    return next();
  }

  const authHeader = req.headers['authorization'] || req.headers['x-access-token'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (authHeader) {
    token = authHeader;
  } else if (req.cookies && req.cookies.iceberg_auth_token) {
    token = req.cookies.iceberg_auth_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'iceberg_internal_jwt_secret_2026');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired authentication token.'
    });
  }
};

/**
 * Middleware factory to enforce Role-Based Access Control.
 * Accepts both new RBAC roles (CEO, CreativeDirector, etc.) and legacy roles (SUPER_ADMIN, etc.).
 * Compares via normalizeRole so old JWT tokens still work.
 * 
 * @param  {...string} allowedRoles - e.g. 'CEO', 'CreativeDirector', 'SUPER_ADMIN'
 */
const authorizeRoles = (...allowedRoles) => {
  // Pre-normalize all allowed roles for comparison
  const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));

  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        error: 'Access forbidden: No authenticated user.'
      });
    }

    const userNormalized = normalizeRole(req.user.role);

    // Direct match on normalized role
    if (normalizedAllowed.includes(userNormalized)) return next();

    // Also allow if any raw role matches (backward compat)
    if (allowedRoles.includes(req.user.role)) return next();

    return res.status(403).json({
      success: false,
      error: `Access forbidden: Role '${req.user.role}' (${userNormalized}) lacks necessary permissions for this resource.`
    });
  };
};

/**
 * Validates time-limited Client Portal Magic Links
 */
const verifyClientPortalToken = (req, res, next) => {
  const token = req.query.token || req.headers['x-client-token'];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Client portal token missing.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'iceberg_internal_jwt_secret_2026');
    if ((decoded.role !== 'CLIENT_VIEWER' && decoded.role !== 'ClientGuest') || !decoded.client_id) {
      return res.status(403).json({
        success: false,
        error: 'Invalid portal token scope.'
      });
    }
    req.clientUser = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Portal link has expired. Please contact your Account Manager for a new link.'
    });
  }
};

module.exports = {
  verifyToken,
  authorizeRoles,
  authorizeMinRole,
  checkPermission,
  verifyClientPortalToken
};

