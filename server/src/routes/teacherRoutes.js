import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import { createExam, addQuestion, finalizeExam, listMyExams, updateExamSettings } from '../controllers/teacherController.js';
import { Result } from '../models/Result.js';

const router = Router();
router.use(authMiddleware(), requireRole('teacher'));

router.post('/exams', createExam);
router.post('/exams/:examId/questions', addQuestion);
router.put('/exams/:examId/settings', updateExamSettings);
router.post('/exams/:examId/finalize', finalizeExam);
router.get('/exams', listMyExams);

// New: get results for an exam the teacher owns
router.get('/exams/:examId/results', async (req, res) => {
  try {
    const { examId } = req.params;
    // ensure teacher owns the exam by filtering results via exam with createdBy
    const results = await Result.find({ exam: examId })
      .populate({ path: 'student', select: 'name email' })
      .populate({ path: 'exam', select: 'title createdBy' });
    // simple ownership check: if any result exists, verify createdBy matches
    if (results.length > 0 && String(results[0].exam.createdBy) !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(results.map(r => ({ id: r._id, student: r.student, score: r.score, total: r.total, submittedAt: r.submittedAt })));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

export default router;
