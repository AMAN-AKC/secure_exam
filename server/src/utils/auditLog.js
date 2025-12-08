import { AuditLog } from '../models/AuditLog.js';

/**
 * Middleware to log audit events
 * Usage: await logAuditEvent(req, userId, action, targetType, targetId, changes, reason, status, error)
 */
export const logAuditEvent = async (req, userId, action, targetType, targetId = null, changes = null, reason = null, status = 'success', error = null) => {
  try {
    // Get user role
    const User = (await import('../models/User.js')).User;
    const actor = await User.findById(userId);
    
    const auditLog = await AuditLog.create({
      action,
      actor: userId,
      actorRole: actor?.role || 'unknown',
      targetType,
      targetId,
      changes,
      reason,
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get?.('user-agent') || req?.headers?.['user-agent'] || null,
      status,
      error,
      context: {
        method: req?.method,
        path: req?.path,
        query: req?.query,
      }
    });

    return auditLog;
  } catch (err) {
    // Log error but don't crash the application
    console.error('Error logging audit event:', err);
  }
};

/**
 * Middleware to automatically extract changes between two objects
 * Useful for tracking what was modified
 */
export const extractChanges = (before, after) => {
  const changes = {
    before: {},
    after: {}
  };

  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  for (const key of keys) {
    if (JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])) {
      changes.before[key] = before?.[key];
      changes.after[key] = after?.[key];
    }
  }

  return Object.keys(changes.before).length > 0 ? changes : null;
};

/**
 * Get audit logs for a specific target
 */
export const getAuditLogsForTarget = async (targetType, targetId) => {
  return AuditLog.find({
    targetType,
    targetId
  })
    .populate('actor', 'name email role')
    .sort({ createdAt: -1 })
    .limit(100);
};

/**
 * Get audit logs for a specific user
 */
export const getAuditLogsForUser = async (userId) => {
  return AuditLog.find({ actor: userId })
    .sort({ createdAt: -1 })
    .limit(100);
};

/**
 * Get recent audit logs (admin dashboard)
 */
export const getRecentAuditLogs = async (limit = 50) => {
  return AuditLog.find()
    .populate('actor', 'name email role')
    .populate('targetId')
    .sort({ createdAt: -1 })
    .limit(limit);
};
