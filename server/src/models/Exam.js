import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: { type: [String], validate: v => v.length === 4, required: true },
    correctIndex: { type: Number, min: 0, max: 3, required: true },
  },
  { _id: false }
);

const ChunkSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    prevHash: { type: String, required: true },
    hash: { type: String, required: true },
    iv: { type: String, required: true },
    cipherText: { type: String, required: true },
  },
  { _id: false }
);

const ExamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' },
    
    // Exam timing settings (set by teacher)
    durationMinutes: { type: Number, default: 60 }, // How long students have to complete exam
    availableFrom: { type: Date }, // When exam becomes available for registration
    availableTo: { type: Date }, // When exam is no longer available
    examStartTime: { type: Date }, // When all students must start (optional)
    examEndTime: { type: Date }, // When all students must finish (optional)
    
    // Exam settings
    allowLateEntry: { type: Boolean, default: false }, // Can students start after scheduled time
    shuffleQuestions: { type: Boolean, default: false }, // Randomize question order
    showResults: { type: Boolean, default: true }, // Show results to students after completion
    
    questions: { type: [QuestionSchema], default: [] },
    chunks: { type: [ChunkSchema], default: [] },
  },
  { timestamps: true }
);

export const Exam = mongoose.model('Exam', ExamSchema);
