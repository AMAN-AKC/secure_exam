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

// Category operations - order matters! More specific routes first
router.post('/', createCategory); // Create new category (must be before parametric routes)
router.get('/', getCategories); // Get all categories
router.get('/check', checkCategoryExists); // Check if category exists (before :name)
router.get('/:name', getCategoryByName); // Get single category by name
router.delete('/:id', deleteCategory); // Delete category

export default router;
