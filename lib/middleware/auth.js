const jwt = require('jsonwebtoken');

/**
 * Verifies JWT token from Authorization Bearer header, x-access-token, or cookie
 */
const verifyToken = (req, res, next) => {
  // Allow demo bypass if in development and query/header specifies demo
  if (process.env.NODE_ENV === 'development' && req.headers['x-demo-admin'] === 'true') {
    req.user = {
      user_id: 'usr_demo_admin',
      email: 'admin@icebergma.com',
      role: 'SUPER_ADMIN',
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
 * Middleware factory to enforce Role-Based Access Control
 * @param  {...string} allowedRoles - e.g. 'SUPER_ADMIN', 'ACCOUNT_MANAGER'
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden: Role '${req.user?.role || 'Guest'}' lacks necessary permissions for this resource.`
      });
    }
    next();
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
    if (decoded.role !== 'CLIENT_VIEWER' || !decoded.client_id) {
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
  verifyClientPortalToken
};
