import { Result } from '../models/Result.js';
import { logAuditEvent } from '../utils/auditLog.js';

/**
 * Middleware to prevent modifications to locked results
 * Should be applied to any PUT/PATCH/DELETE endpoints for results
 */
export const preventLockedResultModification = async (req, res, next) => {
  try {
    const { resultId } = req.params;

    if (!resultId) {
      return next(); // No result ID in params, continue
    }

    const result = await Result.findById(resultId);

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Check if result is locked
    if (result.isLocked) {
      // Log the violation attempt
      await logAuditEvent(
        req,
        req.user?.id,
        'security_alert',
        'Result',
        resultId,
        null,
        `Attempted modification of locked result`,
        'unauthorized'
      ).catch(err => console.error('Audit log error:', err));

      return res.status(403).json({
        error: 'Result is immutable and cannot be modified',
        message: 'This result was locked at submission and cannot be changed',
        lockedAt: result.lockedAt,
        submittedAt: result.submittedAt,
        status: 'LOCKED'
      });
    }

    // Check if result is soft-deleted
    if (result.isDeleted) {
      return res.status(410).json({
        error: 'Result has been deleted',
        message: 'This result is no longer available',
        deletedAt: result.deletedAt,
        status: 'DELETED'
      });
    }

    // Attach result to request for later use
    req.lockedResult = result;
    next();
  } catch (error) {
    console.error('Error in resultImmutability middleware:', error);
    res.status(500).json({ error: 'Failed to verify result status' });
  }
};

/**
 * Middleware to prevent soft-deleted results from being accessed
 */
export const preventAccessToDeletedResults = async (req, res, next) => {
  try {
    const { resultId } = req.params;

    if (!resultId) {
      return next();
    }

    const result = await Result.findById(resultId);

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (result.isDeleted) {
      return res.status(410).json({
        error: 'Result has been deleted',
        message: 'This result is no longer available',
        deletedAt: result.deletedAt,
        deletedBy: result.deletedBy,
        reason: result.deletionReason
      });
    }

    next();
  } catch (error) {
    console.error('Error in preventAccessToDeletedResults middleware:', error);
    res.status(500).json({ error: 'Failed to verify result status' });
  }
};

/**
 * Middleware to block all direct Result updates/deletes
 * Write-once enforcement: Results can only be created, never modified
 */
export const enforceResultWriteOnce = (req, res, next) => {
  // Block PUT, PATCH, DELETE operations on result resources
  if (['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const { resultId } = req.params;

    // Log violation attempt
    logAuditEvent(
      req,
      req.user?.id,
      'security_alert',
      'Result',
      resultId,
      null,
      `Attempted ${req.method} on result (write-once enforcement)`,
      'unauthorized'
    ).catch(err => console.error('Audit log error:', err));

    return res.status(403).json({
      error: 'Write-once semantics enforced',
      message: 'Results cannot be modified after submission. They are immutable.',
      method: req.method,
      resource: 'Result'
    });
  }

  next();
};

/**
 * Query helper to automatically exclude soft-deleted results
 */
export const excludeDeletedResults = (query) => {
  return query.where({ isDeleted: false });
};

/**
 * Hook for Result.findOneAndUpdate to prevent updates on locked results
 */
export const preventUpdateHook = function(next) {
  // This hook is called before findOneAndUpdate
  if (this.getOptions().new !== false) {
    // This is an update operation
    next(new Error('Write-once: Results cannot be updated after creation'));
  } else {
    next();
  }
};
