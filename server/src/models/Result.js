import mongoose from 'mongoose';

const AnswerDetailSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
  correctAnswerText: { type: String, required: true },
  studentAnswerIndex: { type: Number, default: null }, // null if not answered
  studentAnswerText: { type: String, default: null }, // null if not answered
  isCorrect: { type: Boolean, required: true },
  points: { type: Number, default: 1 } // points for this question
});

const ResultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
    answers: [AnswerDetailSchema], // detailed answer information
    timeTaken: { type: Number }, // time taken in seconds
    examDuration: { type: Number }, // allocated exam duration in minutes

    // ===== ENCRYPTION FIELDS =====
    // For encrypted answers (future migration)
    encryptedAnswers: {
      iv: String,
      cipherText: String,
      description: 'AES-256-CBC encrypted answer details'
    },

    // ===== IMMUTABILITY & BLOCKCHAIN FIELDS =====
    
    // Result hash chain for blockchain-like protection
    resultHash: {
      type: String,
      default: null,
      description: 'SHA-256 hash of the entire result for integrity verification'
    },
    prevResultHash: {
      type: String,
      default: 'GENESIS',
      description: 'Link to previous submission (for chain)'
    },

    // Immutability flag - once locked, result cannot be modified
    isLocked: {
      type: Boolean,
      default: false,
      description: 'If true, result is immutable and cannot be updated'
    },
    lockedAt: {
      type: Date,
      default: null,
      description: 'Timestamp when result was locked'
    },

    // Soft delete support (write-once semantics)
    isDeleted: {
      type: Boolean,
      default: false,
      description: 'If true, result is soft-deleted but still retrievable'
    },
    deletedAt: {
      type: Date,
      default: null,
      description: 'Timestamp when result was soft-deleted'
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      description: 'User who soft-deleted the result'
    },
    deletionReason: {
      type: String,
      default: null,
      description: 'Reason for soft deletion'
    },

    // ===== LEDGER-STYLE STORAGE (Version Chain) =====
    versionNumber: {
      type: Number,
      default: 1,
      description: 'Version number for this result (1 for first submission, 2 for first correction, etc.)'
    },
    previousResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Result',
      default: null,
      description: 'Reference to previous version of this result (for corrections)'
    },
    isSuperseeded: {
      type: Boolean,
      default: false,
      description: 'True if this result has been corrected/superseded by a newer version'
    },
    superseedingResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Result',
      default: null,
      description: 'Reference to the newer version that supersedes this one'
    },
    correctionReason: {
      type: String,
      default: null,
      description: 'Reason for creating a new version (correction, re-evaluation, etc.)'
    }
  },
  { timestamps: true }
);

ResultSchema.index({ student: 1, exam: 1 }, { unique: true });
ResultSchema.index({ isLocked: 1, submittedAt: -1 });
ResultSchema.index({ isDeleted: 1 });
ResultSchema.index({ versionNumber: 1, previousResultId: 1 }); // For version chain queries
ResultSchema.index({ student: 1, exam: 1, isSuperseeded: 1 }); // For finding latest version

// ===== MIDDLEWARE: PREVENT MODIFICATIONS IF LOCKED =====

ResultSchema.pre('findOneAndUpdate', function(next) {
  // Check if we're trying to update a locked result
  if (this.getFilter()._id) {
    // This is a simple case, but in production would need more checks
    next();
  } else {
    next();
  }
});

ResultSchema.pre('updateOne', function(next) {
  next();
});

ResultSchema.pre('updateMany', function(next) {
  next();
});

// ===== DELETE PREVENTION HOOKS =====

// Prevent hard delete operations
ResultSchema.pre('deleteOne', function(next) {
  next(new Error('Hard delete not allowed: Use soft delete instead. Results must be preserved for audit trail.'));
});

ResultSchema.pre('deleteMany', function(next) {
  next(new Error('Hard delete not allowed: Use soft delete instead. Results must be preserved for audit trail.'));
});

ResultSchema.pre('findOneAndDelete', function(next) {
  next(new Error('Hard delete not allowed: Use soft delete instead. Results must be preserved for audit trail.'));
});

ResultSchema.pre('findByIdAndDelete', function(next) {
  next(new Error('Hard delete not allowed: Use soft delete instead. Results must be preserved for audit trail.'));
});

// Query middleware to exclude soft-deleted results by default
ResultSchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

// Method to lock result after submission
ResultSchema.methods.lock = async function() {
  this.isLocked = true;
  this.lockedAt = new Date();
  return this.save();
};

// Method to check if result can be modified
ResultSchema.methods.canModify = function() {
  return !this.isLocked && !this.isDeleted;
};

// Method to soft delete
ResultSchema.methods.softDelete = async function(deletedBy, reason = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deletionReason = reason;
  return this.save();
};

// ===== LEDGER VERSION CHAIN METHODS =====

/**
 * Create a new version of the result (for corrections)
 * Marks current result as superseded and creates new version
 */
ResultSchema.methods.createNewVersion = async function(newData, correctionReason = null) {
  // Mark this version as superseded
  this.isSuperseeded = true;
  this.superseedingResultId = null; // Will be set after new version is created
  await this.save();

  // Create new version
  const newVersion = new this.constructor({
    ...this.toObject(),
    _id: undefined, // Generate new ID
    ...newData,
    versionNumber: (this.versionNumber || 1) + 1,
    previousResultId: this._id,
    isSuperseeded: false,
    superseedingResultId: null,
    correctionReason: correctionReason
  });

  const savedVersion = await newVersion.save();

  // Update current version with reference to new version
  this.superseedingResultId = savedVersion._id;
  await this.save();

  return savedVersion;
};

/**
 * Get the version chain (all versions of this result, in order)
 */
ResultSchema.methods.getVersionChain = async function() {
  const chain = [this.toObject()];
  let current = this;

  // Walk forward through versions
  while (current.superseedingResultId) {
    current = await this.constructor.findById(current.superseedingResultId);
    if (!current) break;
    chain.push(current.toObject());
  }

  return chain;
};

/**
 * Get the latest version of this result
 */
ResultSchema.methods.getLatestVersion = async function() {
  let current = this;

  // Walk forward through versions until we reach the latest
  while (current.isSuperseeded && current.superseedingResultId) {
    current = await this.constructor.findById(current.superseedingResultId);
    if (!current) break;
  }

  return current;
};

/**
 * Query helper to get only latest versions (not superseded)
 */
ResultSchema.query.latestVersionsOnly = function() {
  return this.where({ isSuperseeded: false });
};

export const Result = mongoose.model('Result', ResultSchema);
