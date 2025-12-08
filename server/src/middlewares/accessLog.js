import { AccessLog } from '../models/AccessLog.js';

/**
 * Middleware to log resource access
 * Usage: router.get('/exams/:examId', logResourceAccess('exam'), getExamHandler)
 */
export const logResourceAccess = (resource) => async (req, res, next) => {
  try {
    const resourceId = req.params.examId || req.params.resultId || req.params.id;
    const resourceTitle = req.query.title || req.body.title || null;

    if (resourceId && req.user) {
      // Determine action based on request method and context
      let action = 'viewed_' + resource;
      if (req.params.examId && req.path.includes('access')) action = 'accessed_exam';
      if (req.params.examId && req.path.includes('submit')) action = 'submitted_exam';

      // Log asynchronously (don't block response)
      await AccessLog.logAccess(
        req,
        req.user.id,
        action,
        resource,
        resourceId,
        resourceTitle,
        {
          method: req.method,
          url: req.originalUrl,
          query: req.query
        }
      );
    }

    next();
  } catch (error) {
    console.error('Error in logResourceAccess middleware:', error);
    // Don't fail request if logging fails
    next();
  }
};

/**
 * Endpoint to retrieve access logs for admin dashboard
 */
export const getAccessLogs = async (req, res) => {
  try {
    const { limit = 100, user, resource, resourceId, action, startDate, endDate } = req.query;

    let query = {};

    if (user) {
      query.user = user;
    }

    if (resource) {
      query.resource = resource;
    }

    if (resourceId) {
      query.resourceId = resourceId;
    }

    if (action) {
      query.action = action;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const logs = await AccessLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit) || 100, 1000));

    // Get statistics
    const stats = {
      totalAccesses: logs.length,
      accessesByAction: {},
      accessesByResource: {},
      uniqueUsers: new Set()
    };

    logs.forEach(log => {
      stats.accessesByAction[log.action] = (stats.accessesByAction[log.action] || 0) + 1;
      stats.accessesByResource[log.resource] = (stats.accessesByResource[log.resource] || 0) + 1;
      stats.uniqueUsers.add(log.user._id.toString());
    });

    stats.uniqueUsers = stats.uniqueUsers.size;

    res.json({
      count: logs.length,
      logs,
      stats
    });
  } catch (error) {
    console.error('Error fetching access logs:', error);
    res.status(500).json({ error: 'Failed to fetch access logs', details: error.message });
  }
};

/**
 * Get access history for a specific user
 */
export const getUserAccessHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const logs = await AccessLog.find({ user: userId })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit) || 50, 500));

    res.json({
      userId,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Error fetching user access history:', error);
    res.status(500).json({ error: 'Failed to fetch access history', details: error.message });
  }
};

/**
 * Get access history for a specific resource
 */
export const getResourceAccessHistory = async (req, res) => {
  try {
    const { resource, resourceId } = req.params;
    const { limit = 50 } = req.query;

    const logs = await AccessLog.find({ resource, resourceId })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit) || 50, 500));

    res.json({
      resource,
      resourceId,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Error fetching resource access history:', error);
    res.status(500).json({ error: 'Failed to fetch access history', details: error.message });
  }
};
