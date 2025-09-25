import mongoose from 'mongoose';

const ResultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ResultSchema.index({ student: 1, exam: 1 }, { unique: true });

export const Result = mongoose.model('Result', ResultSchema);
