import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [3, 'Category must be at least 3 characters'],
    maxlength: [50, 'Category cannot exceed 50 characters'],
    unique: true,
    lowercase: true,
    index: true
  },

  description: {
    type: String,
    default: null
  },

  isDefault: {
    type: Boolean,
    default: false
  },

  usageCount: {
    type: Number,
    default: 0,
    index: true
  },

  lastUsedAt: {
    type: Date,
    default: null
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

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

// Index for efficient querying
categorySchema.index({ isDefault: 1, createdAt: -1 });
categorySchema.index({ createdBy: 1, createdAt: -1 });
categorySchema.index({ isDefault: 1, usageCount: -1 }); // For sorting by usage

export const Category = mongoose.model('Category', categorySchema);
