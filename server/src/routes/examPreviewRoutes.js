import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { requireIdentityVerification } from '../middlewares/verifyIdentity.js';
import {
  getQuestionPreview,
  completePreview,
  finalizeExam,
  updateQuestionMarking,
  getExamMarkingStats
} from '../middlewares/questionPreview.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware());

// Question preview endpoints
router.get('/:examId/preview', getQuestionPreview); // Get preview of all questions
router.post('/:examId/preview/complete', completePreview); // Mark preview as complete

// Finalization
router.post('/:examId/finalize', finalizeExam); // Finalize exam

// Marking system
router.patch('/:examId/questions/:questionIndex/marking', updateQuestionMarking); // Update question points
router.get('/:examId/marking-stats', getExamMarkingStats); // Get marking summary

export default router;
