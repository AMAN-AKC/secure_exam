import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  approveQuestion,
  getQuestionsByCategory,
  getQuestionsByDifficulty,
  getQuestionStats
} from '../controllers/questionBankController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware());

// Question CRUD operations
router.post('/', createQuestion); // Create new question
router.get('/', getQuestions); // Get all with filtering
router.get('/stats', getQuestionStats); // Get statistics
router.get('/category/:category', getQuestionsByCategory); // Get by category
router.get('/difficulty/:difficulty', getQuestionsByDifficulty); // Get by difficulty
router.get('/:id', getQuestion); // Get single question
router.patch('/:id', updateQuestion); // Update question
router.delete('/:id', deleteQuestion); // Soft delete

// Admin operations
router.post('/:id/approve', approveQuestion); // Approve question

export default router;
