import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import { listAllExams, setExamStatus } from '../controllers/adminController.js';
import { Result } from '../models/Result.js';

const router = Router();
router.use(authMiddleware(), requireRole('admin'));

router.get('/exams', listAllExams);
router.patch('/exams/:examId/status', setExamStatus);

// Teacher view results - keep under admin router? Better to expose under teacher router.
export default router;
