import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    // What action was performed
    action: {
      type: String,
      enum: [
        'exam_created',
        'exam_modified',
        'exam_deleted',
        'exam_approved',
        'exam_rejected',
        'exam_finalized',
        'exam_published',
        'result_viewed',
        'result_submitted',
        'result_modified',
        'result_deleted',
        'user_created',
        'user_modified',
        'user_deleted',
        'user_login',
        'user_logout',
        'user_password_changed',
        'registration_created',
        'registration_modified',
        'registration_deleted',
        'admin_approval_given',
        'admin_rejection_given',
        'security_alert',
        'bulk_student_import'
      ],
      required: true
    },

    // Who performed the action
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actorRole: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      required: true
    },

    // What was acted upon
    targetType: {
      type: String,
      enum: ['Exam', 'Result', 'User', 'Registration', 'System'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetType',
      default: null
    },

    // What changed (for modification actions)
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed
    },

    // Why was the action taken
    reason: {
      type: String,
      default: null
    },

    // Request metadata
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },

    // Result of action
    status: {
      type: String,
      enum: ['success', 'failed', 'unauthorized'],
      default: 'success'
    },

    // Error details if failed
    error: {
      type: String,
      default: null
    },

    // Additional context
    context: mongoose.Schema.Types.Mixed,

    // Auto-generated timestamp
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: false } // We manually control timestamps
);

// Index for efficient querying
AuditLogSchema.index({ actor: 1, createdAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

// Prevent modifications to audit logs (immutable)
AuditLogSchema.pre('save', function(next) {
  if (!this.isNew) {
    next(new Error('Audit logs are immutable and cannot be modified'));
  }
  next();
});

AuditLogSchema.pre('findOneAndUpdate', function(next) {
  next(new Error('Audit logs are immutable and cannot be modified'));
});

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
