import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import { listApprovedExams, registerForExam, getScheduledExams, accessExam, submitExam, myResults } from '../controllers/studentController.js';

const router = Router();
router.use(authMiddleware(), requireRole('student'));

router.get('/exams', listApprovedExams);
router.post('/registrations', registerForExam);
router.get('/registrations', getScheduledExams);
router.get('/exams/:examId/access', accessExam);
router.post('/exams/:examId/submit', submitExam);
router.get('/results', myResults);

export default router;
