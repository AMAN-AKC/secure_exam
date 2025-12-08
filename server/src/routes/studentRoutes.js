import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import { listApprovedExams, registerForExam, getScheduledExams, accessExam, submitExam, myResults, getDetailedResult, verifyResultIntegrity } from '../controllers/studentController.js';
import { enforceResultWriteOnce, preventAccessToDeletedResults } from '../middlewares/resultImmutability.js';
import { logResourceAccess } from '../middlewares/accessLog.js';

const router = Router();
router.use(authMiddleware(), requireRole('student'));

// Apply access logging to key GET endpoints
router.get('/exams', logResourceAccess('exam'), listApprovedExams);
router.post('/registrations', registerForExam);
router.get('/registrations', logResourceAccess('exam'), getScheduledExams);
router.get('/exams/:examId/access', logResourceAccess('exam'), accessExam);
router.post('/exams/:examId/submit', submitExam);
router.get('/results', logResourceAccess('result'), myResults);
router.get('/results/:resultId/details', logResourceAccess('result'), preventAccessToDeletedResults, getDetailedResult);
router.get('/results/:resultId/verify-blockchain', logResourceAccess('result'), preventAccessToDeletedResults, verifyResultIntegrity);

// Enforce write-once semantics: Block all direct result updates/deletes
router.use('/results', enforceResultWriteOnce);

export default router;
