import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import { createExam, addQuestion, finalizeExam, listMyExams, updateExamSettings, deleteExam, getExamResults } from '../controllers/teacherController.js';
import { requireIdentityVerification } from '../middlewares/verifyIdentity.js';
import { logResourceAccess } from '../middlewares/accessLog.js';
import { getExamChangeHistory, getResultChangeHistory } from '../middlewares/changeTracking.js';

const router = Router();
router.use(authMiddleware(), requireRole('teacher'));

router.post('/exams', createExam);
router.post('/exams/:examId/questions', addQuestion);
router.put('/exams/:examId/settings', updateExamSettings);

// Finalize exam - marks exam as ready for student access
router.post('/exams/:examId/finalize', finalizeExam);

router.delete('/exams/:examId', deleteExam);
router.get('/exams', logResourceAccess('exam'), listMyExams);
router.get('/exams/:examId/results', logResourceAccess('exam_results'), getExamResults);

// Change tracking endpoints
router.get('/exams/:examId/change-history', logResourceAccess('exam'), getExamChangeHistory); // View exam modifications
router.get('/results/:resultId/change-history', logResourceAccess('result'), getResultChangeHistory); // View result modifications

export default router;
