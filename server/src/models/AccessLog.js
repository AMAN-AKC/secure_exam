import mongoose from 'mongoose';

const AccessLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      description: 'User who accessed the resource'
    },
    action: {
      type: String,
      enum: ['viewed_exam', 'accessed_exam', 'viewed_results', 'accessed_result', 'started_exam', 'submitted_exam'],
      required: true,
      description: 'Type of access action'
    },
    resource: {
      type: String,
      enum: ['exam', 'result', 'question_bank'],
      required: true,
      description: 'Type of resource accessed'
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      description: 'ID of the resource accessed'
    },
    resourceTitle: {
      type: String,
      default: null,
      description: 'Title of the resource (exam name, etc.) for reference'
    },
    ipAddress: {
      type: String,
      default: null,
      description: 'IP address from which access occurred'
    },
    userAgent: {
      type: String,
      default: null,
      description: 'Browser/device user agent string'
    },
    duration: {
      type: Number,
      default: null,
      description: 'Time spent in seconds (if applicable)'
    },
    metadata: {
      type: Object,
      default: {},
      description: 'Additional metadata about the access'
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      description: 'When the access occurred'
    }
  },
  { timestamps: false } // We don't need updatedAt since logs are append-only
);

// Indexes for efficient querying
AccessLogSchema.index({ user: 1, createdAt: -1 }); // Get user's access history
AccessLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 }); // Get who accessed what
AccessLogSchema.index({ action: 1, createdAt: -1 }); // Get specific action types
AccessLogSchema.index({ user: 1, resource: 1, createdAt: -1 }); // User's access to resource type

/**
 * Query helper to get access logs for a specific resource
 */
AccessLogSchema.query.forResource = function(resource, resourceId) {
  return this.where({ resource, resourceId }).sort({ createdAt: -1 });
};

/**
 * Query helper to get access logs for a specific user
 */
AccessLogSchema.query.forUser = function(userId) {
  return this.where({ user: userId }).sort({ createdAt: -1 });
};

/**
 * Query helper to get logs within a date range
 */
AccessLogSchema.query.withinDateRange = function(startDate, endDate) {
  return this.where({
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ createdAt: -1 });
};

/**
 * Static method to log access
 */
AccessLogSchema.statics.logAccess = async function(req, userId, action, resource, resourceId, resourceTitle = null, metadata = {}) {
  try {
    const log = new this({
      user: userId,
      action,
      resource,
      resourceId,
      resourceTitle,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || null,
      metadata
    });
    return await log.save();
  } catch (error) {
    console.error('Error logging access:', error);
    // Don't throw - access logging failure shouldn't break the app
    return null;
  }
};

export const AccessLog = mongoose.model('AccessLog', AccessLogSchema);
