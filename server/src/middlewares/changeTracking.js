import { AuditLog } from '../models/AuditLog.js';
import { Exam } from '../models/Exam.js';
import { Result } from '../models/Result.js';
import { User } from '../models/User.js';

/**
 * Get change history for an exam
 * Shows all modifications with before/after values
 */
export async function getExamChangeHistory(req, res) {
  try {
    const { examId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Verify exam exists and user has access
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Check permissions
    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get audit logs for this exam
    const logs = await AuditLog.find({
      targetType: 'Exam',
      targetId: examId
    })
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit), 100))
      .skip(parseInt(skip))
      .lean();

    // Format changes for timeline display
    const changeTimeline = logs.map(log => {
      const changeDetails = [];

      if (log.changes && log.changes.before && log.changes.after) {
        Object.keys(log.changes.after).forEach(key => {
          const beforeVal = log.changes.before[key];
          const afterVal = log.changes.after[key];

          // Only show fields that actually changed
          if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
            changeDetails.push({
              field: formatFieldName(key),
              before: formatFieldValue(key, beforeVal),
              after: formatFieldValue(key, afterVal),
              changed: true
            });
          }
        });
      }

      return {
        timestamp: log.createdAt,
        action: formatActionName(log.action),
        actionType: log.action,
        actor: {
          id: log.actor._id,
          name: log.actor.name,
          email: log.actor.email,
          role: log.actor.role
        },
        reason: log.reason,
        changes: changeDetails,
        status: log.status,
        ipAddress: log.ipAddress
      };
    });

    // Get total count
    const totalCount = await AuditLog.countDocuments({
      targetType: 'Exam',
      targetId: examId
    });

    res.json({
      success: true,
      examId,
      examTitle: exam.title,
      timeline: changeTimeline,
      pagination: {
        total: totalCount,
        limit: Math.min(parseInt(limit), 100),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + parseInt(limit) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching exam change history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch change history' });
  }
}

/**
 * Get change history for a result
 */
export async function getResultChangeHistory(req, res) {
  try {
    const { resultId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Verify result exists
    const result = await Result.findById(resultId).populate('studentId');
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    // Check permissions (student can only view their own, teacher/admin can view all)
    if (req.user.role === 'student' && result.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get audit logs for this result
    const logs = await AuditLog.find({
      targetType: 'Result',
      targetId: resultId
    })
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit), 100))
      .skip(parseInt(skip))
      .lean();

    // Format changes for timeline display
    const changeTimeline = logs.map(log => {
      const changeDetails = [];

      if (log.changes && log.changes.before && log.changes.after) {
        Object.keys(log.changes.after).forEach(key => {
          const beforeVal = log.changes.before[key];
          const afterVal = log.changes.after[key];

          if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
            changeDetails.push({
              field: formatFieldName(key),
              before: formatFieldValue(key, beforeVal),
              after: formatFieldValue(key, afterVal),
              changed: true
            });
          }
        });
      }

      return {
        timestamp: log.createdAt,
        action: formatActionName(log.action),
        actionType: log.action,
        actor: {
          id: log.actor._id,
          name: log.actor.name,
          email: log.actor.email,
          role: log.actor.role
        },
        reason: log.reason,
        changes: changeDetails,
        status: log.status,
        ipAddress: log.ipAddress
      };
    });

    // Get total count
    const totalCount = await AuditLog.countDocuments({
      targetType: 'Result',
      targetId: resultId
    });

    res.json({
      success: true,
      resultId,
      studentName: result.studentId.name,
      timeline: changeTimeline,
      pagination: {
        total: totalCount,
        limit: Math.min(parseInt(limit), 100),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + parseInt(limit) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching result change history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch change history' });
  }
}

/**
 * Admin: Get all changes for a user
 */
export async function getUserChangeHistory(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 100, skip = 0 } = req.query;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get all audit logs where this user is the actor
    const logs = await AuditLog.find({ actor: userId })
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit), 200))
      .skip(parseInt(skip))
      .lean();

    // Format timeline
    const timeline = logs.map(log => ({
      timestamp: log.createdAt,
      action: formatActionName(log.action),
      actionType: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      status: log.status,
      reason: log.reason,
      hasChanges: !!(log.changes && log.changes.before && log.changes.after)
    }));

    // Get statistics
    const actionStats = {};
    logs.forEach(log => {
      actionStats[log.action] = (actionStats[log.action] || 0) + 1;
    });

    // Get total count
    const totalCount = await AuditLog.countDocuments({ actor: userId });

    res.json({
      success: true,
      userId,
      userName: user.name,
      userEmail: user.email,
      timeline,
      statistics: {
        totalActions: totalCount,
        actionsByType: actionStats,
        timespan: {
          earliest: logs.length > 0 ? logs[logs.length - 1].createdAt : null,
          latest: logs.length > 0 ? logs[0].createdAt : null
        }
      },
      pagination: {
        total: totalCount,
        limit: Math.min(parseInt(limit), 200),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + parseInt(limit) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching user change history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch change history' });
  }
}

/**
 * Get summary of recent changes for dashboard
 */
export async function getRecentChanges(req, res) {
  try {
    const { limit = 20 } = req.query;

    const logs = await AuditLog.find()
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit), 100))
      .lean();

    const summary = logs.map(log => ({
      timestamp: log.createdAt,
      action: formatActionName(log.action),
      actor: {
        name: log.actor.name,
        role: log.actor.role
      },
      target: {
        type: log.targetType,
        id: log.targetId
      },
      status: log.status
    }));

    res.json({
      success: true,
      recentChanges: summary,
      count: summary.length
    });
  } catch (error) {
    console.error('Error fetching recent changes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent changes' });
  }
}

/**
 * Helper functions for formatting
 */

function formatFieldName(fieldName) {
  // Convert camelCase to Title Case
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Insert space before uppercase
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();
}

function formatFieldValue(fieldName, value) {
  if (value === null || value === undefined) {
    return 'Not set';
  }

  if (fieldName.includes('At') || fieldName.includes('Date')) {
    return new Date(value).toLocaleString();
  }

  if (Array.isArray(value)) {
    return `Array (${value.length} items)`;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value).substring(0, 100);
}

function formatActionName(action) {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Helper: Get summary stats for admin dashboard
 */
export async function getChangeStatistics(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Count by action type
    const byAction = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Count by target type
    const byTarget = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$targetType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Count by status
    const byStatus = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Most active actors
    const topActors = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$actor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          userId: '$_id',
          count: 1,
          userName: { $arrayElemAt: ['$userInfo.name', 0] },
          userRole: { $arrayElemAt: ['$userInfo.role', 0] }
        }
      }
    ]);

    res.json({
      success: true,
      statistics: {
        byAction,
        byTarget,
        byStatus,
        topActors,
        totalChanges: await AuditLog.countDocuments(query)
      },
      timeRange: {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      }
    });
  } catch (error) {
    console.error('Error fetching change statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
}
