import mongoose from 'mongoose';

const RegistrationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
  },
  { timestamps: true }
);

RegistrationSchema.index({ student: 1, exam: 1 }, { unique: true });

export const Registration = mongoose.model('Registration', RegistrationSchema);
