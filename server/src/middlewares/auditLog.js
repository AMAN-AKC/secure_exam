import { logAuditEvent } from '../utils/auditLog.js';

/**
 * Middleware to automatically log sensitive operations
 * Wrap specific route handlers with this to log their actions
 */
export const auditLogWrapper = (action, targetType) => {
  return async (req, res, next) => {
    // Capture the original res.json to intercept responses
    const originalJson = res.json;

    res.json = function(data) {
      // Log the action after the response
      if (res.statusCode < 400) {
        // Only log successful operations
        const targetId = req.params?.examId || req.params?.resultId || data?._id;
        
        logAuditEvent(
          req,
          req.user?.id,
          action,
          targetType,
          targetId,
          null,
          null,
          'success'
        ).catch(err => console.error('Audit log error:', err));
      }

      // Call the original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to log access to sensitive resources
 */
export const logResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    const resourceId = req.params?.examId || req.params?.resultId;

    // Log after response is sent
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode === 200 && req.user?.id) {
        logAuditEvent(
          req,
          req.user.id,
          `${resourceType}_accessed`,
          resourceType,
          resourceId,
          null,
          null,
          'success'
        ).catch(err => console.error('Audit log error:', err));
      }
      return originalJson.call(this, data);
    };

    next();
  };
};
