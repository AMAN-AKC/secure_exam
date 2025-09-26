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
  },
  { timestamps: true }
);

ResultSchema.index({ student: 1, exam: 1 }, { unique: true });

export const Result = mongoose.model('Result', ResultSchema);
