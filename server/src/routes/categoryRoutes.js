import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import {
  getCategories,
  createCategory,
  getCategoryByName,
  deleteCategory,
  checkCategoryExists
} from '../controllers/categoryController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware());

// Category operations
router.get('/', getCategories); // Get all categories
router.post('/', createCategory); // Create new category
router.get('/check', checkCategoryExists); // Check if category exists
router.get('/:name', getCategoryByName); // Get single category by name
router.delete('/:id', deleteCategory); // Delete category

export default router;
