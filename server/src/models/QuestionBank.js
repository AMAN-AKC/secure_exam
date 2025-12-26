import mongoose from 'mongoose';

const questionBankSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    minlength: [5, 'Question must be at least 5 characters'],
    maxlength: [2000, 'Question cannot exceed 2000 characters'],
    index: true
  },

  category: {
    type: String,
    required: [true, 'Question category is required'],
    trim: true,
    minlength: [3, 'Category must be at least 3 characters'],
    maxlength: [50, 'Category cannot exceed 50 characters'],
    index: true
  },

  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },

  tags: {
    type: [String],
    default: [],
    index: true
  },

  content: {
    type: String,
    required: [true, 'Question content is required']
  },

  // Option format: { text: string, isCorrect: boolean, explanation: string }
  options: {
    type: [{
      text: {
        type: String,
        required: true,
        minlength: 1
      },
      isCorrect: {
        type: Boolean,
        default: false
      },
      explanation: {
        type: String,
        default: null
      }
    }],
    validate: {
      validator: function(options) {
        return options.length >= 2 && options.length <= 6;
      },
      message: 'Question must have between 2 and 6 options'
    }
  },

  // Marking settings
  points: {
    type: Number,
    default: 1,
    min: [0.25, 'Points must be at least 0.25'],
    max: [100, 'Points cannot exceed 100']
  },

  negativeMark: {
    type: Number,
    default: 0,
    min: 0
  },

  partialCredit: {
    type: Boolean,
    default: false
  },

  // Question metadata
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  createdBy: {
    type: String,
    default: 'Unknown'
  },

  description: {
    type: String,
    default: null
  },

  source: {
    type: String,
    default: 'internal'
  },

  // Question stats
  usageCount: {
    type: Number,
    default: 0
  },

  successRate: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },

  avgTimeSeconds: {
    type: Number,
    default: null,
    min: 0
  },

  // Approval workflow
  isApproved: {
    type: Boolean,
    default: false,
    index: true
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  approvedAt: {
    type: Date,
    default: null
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'archived'],
    default: 'draft',
    index: true
  },

  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },

  deletedAt: {
    type: Date,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for efficient querying
questionBankSchema.index({ category: 1, difficulty: 1, status: 1 });
questionBankSchema.index({ creator: 1, createdAt: -1 });
questionBankSchema.index({ tags: 1, status: 1 });
questionBankSchema.index({ isApproved: 1, isDeleted: 1 });

// Query helper to exclude deleted questions
questionBankSchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

// Query helper for approved questions
questionBankSchema.query.approved = function() {
  return this.where({ status: 'approved', isDeleted: false });
};

// Query helper for specific category
questionBankSchema.query.byCategory = function(category) {
  return this.where({ category, isDeleted: false });
};

// Query helper for search
questionBankSchema.statics.search = async function(searchTerm, filters = {}) {
  const query = {
    isDeleted: false,
    ...filters
  };

  if (searchTerm) {
    query.$or = [
      { title: { $regex: searchTerm, $options: 'i' } },
      { content: { $regex: searchTerm, $options: 'i' } },
      { tags: { $regex: searchTerm, $options: 'i' } }
    ];
  }

  return this.find(query).sort({ createdAt: -1 });
};

// Static method to create from template
questionBankSchema.statics.createFromTemplate = async function(templateData, creatorId) {
  const question = new this({
    ...templateData,
    creator: creatorId,
    createdBy: templateData.createdBy || 'System'
  });

  await question.save();
  return question;
};

// Prevent modification if approved
questionBankSchema.pre('save', function(next) {
  if (this.isModified() && this.isApproved) {
    // Allow status changes and soft deletes
    if (!this.isModified('status') && !this.isModified('isDeleted')) {
      next(new Error('Cannot modify an approved question. Archive and create new version instead.'));
      return;
    }
  }
  next();
});

export const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);
