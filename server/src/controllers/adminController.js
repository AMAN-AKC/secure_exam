import { Exam } from '../models/Exam.js';

export const listAllExams = async (_req, res) => {
  const exams = await Exam.find().populate('createdBy', 'name email role');
  res.json(exams);
};

export const setExamStatus = async (req, res) => {
  const { examId } = req.params;
  const { status } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const exam = await Exam.findById(examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  exam.status = status;
  await exam.save();
  res.json(exam);
};
