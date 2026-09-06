const AuditLog = require('../models/AuditLog');
const UserEvent = require('../models/UserEvent');

/**
 * Extracts client IP address safely from Express request
 */
function getClientIp(req) {
  if (!req) return '';
  const forwarded = req.headers ? (req.headers['x-forwarded-for'] || '') : '';
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || (req.socket ? req.socket.remoteAddress : '') || '';
}

/**
 * Extracts User Agent safely from Express request
 */
function getUserAgent(req) {
  if (!req || !req.headers) return '';
  return req.headers['user-agent'] || '';
}

/**
 * Computes a clean diff between before and after objects.
 * Returns { added: {}, removed: {}, changed: {} }
 */
function diffObjects(before, after) {
  const result = {
    added: {},
    removed: {},
    changed: {}
  };

  if (!before && !after) return result;

  const b = before ? (typeof before.toObject === 'function' ? before.toObject() : { ...before }) : {};
  const a = after ? (typeof after.toObject === 'function' ? after.toObject() : { ...after }) : {};

  // Strip sensitive and noisy internal keys
  const ignoredKeys = ['password', '__v', 'updated_at', 'updatedAt'];
  ignoredKeys.forEach(k => {
    delete b[k];
    delete a[k];
  });

  const bKeys = Object.keys(b);
  const aKeys = Object.keys(a);

  // Added keys
  for (const k of aKeys) {
    if (!(k in b)) {
      result.added[k] = a[k];
    }
  }

  // Removed keys
  for (const k of bKeys) {
    if (!(k in a)) {
      result.removed[k] = b[k];
    }
  }

  // Changed keys
  for (const k of aKeys) {
    if (k in b) {
      const valB = b[k];
      const valA = a[k];
      const strB = typeof valB === 'object' ? JSON.stringify(valB) : String(valB);
      const strA = typeof valA === 'object' ? JSON.stringify(valA) : String(valA);
      if (strB !== strA) {
        result.changed[k] = {
          before: valB,
          after: valA
        };
      }
    }
  }

  return result;
}

/**
 * Writes an AuditLog record synchronously/blocking
 */
async function logAudit({
  req,
  action,
  entityType,
  entityId,
  severity = 'INFO',
  before = null,
  after = null,
  details = {}
}) {
  try {
    const user_id = req?.user?.user_id || req?.user?.id || req?.user?._id || null;
    const user_email = req?.user?.email || req?.body?.email || 'system';
    const ip_address = getClientIp(req);
    const user_agent = getUserAgent(req);

    // Auto compute diff if before and after provided but not details.diff
    let calculatedDetails = { ...details };
    if (before && after && !calculatedDetails.diff) {
      calculatedDetails.diff = diffObjects(before, after);
    }

    const logEntry = await AuditLog.create({
      user_id,
      user_email,
      action,
      severity,
      entity_type: entityType,
      entity_id: String(entityId || 'system'),
      before: before ? (typeof before.toObject === 'function' ? before.toObject() : before) : null,
      after: after ? (typeof after.toObject === 'function' ? after.toObject() : after) : null,
      details: calculatedDetails,
      ip_address,
      user_agent
    });

    return logEntry;
  } catch (err) {
    console.error('[Audit Log Error]:', err.message || err);
    return null;
  }
}

/**
 * Fire-and-forget variant of logAudit (non-blocking)
 */
function logAuditAsync(params) {
  setImmediate(() => {
    logAudit(params).catch(err => {
      console.error('[Audit Log Async Failure]:', err.message || err);
    });
  });
}

/**
 * Writes a UserEvent record (for behavioral analytics)
 */
async function logUserEvent({
  req,
  eventType,
  entityType = '',
  entityId = '',
  metadata = {},
  durationMs = 0,
  sessionId = ''
}) {
  try {
    const user_id = req?.user?.user_id || req?.user?.id || req?.user?._id || null;
    const user_email = req?.user?.email || '';
    const ip_address = getClientIp(req);
    const user_agent = getUserAgent(req);
    const session_id = sessionId || (req?.headers ? req.headers['x-session-id'] : '') || '';

    const event = await UserEvent.create({
      user_id,
      user_email,
      event_type: eventType,
      entity_type: entityType,
      entity_id: String(entityId || ''),
      session_id,
      duration_ms: durationMs || 0,
      metadata,
      ip_address,
      user_agent
    });

    return event;
  } catch (err) {
    console.error('[User Event Log Error]:', err.message || err);
    return null;
  }
}

/**
 * Fire-and-forget variant of logUserEvent
 */
function logUserEventAsync(params) {
  setImmediate(() => {
    logUserEvent(params).catch(err => {
      console.error('[User Event Async Failure]:', err.message || err);
    });
  });
}

module.exports = {
  logAudit,
  logAuditAsync,
  logUserEvent,
  logUserEventAsync,
  diffObjects,
  getClientIp,
  getUserAgent
};
