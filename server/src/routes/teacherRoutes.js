import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import { createExam, addQuestion, finalizeExam, listMyExams, updateExamSettings, deleteExam, getExamResults } from '../controllers/teacherController.js';

const router = Router();
router.use(authMiddleware(), requireRole('teacher'));

router.post('/exams', createExam);
router.post('/exams/:examId/questions', addQuestion);
router.put('/exams/:examId/settings', updateExamSettings);
router.post('/exams/:examId/finalize', finalizeExam);
router.delete('/exams/:examId', deleteExam);
router.get('/exams', listMyExams);
router.get('/exams/:examId/results', getExamResults);

export default router;
