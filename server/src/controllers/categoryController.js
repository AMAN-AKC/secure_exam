import { Category } from '../models/Category.js';
import { logAuditEvent } from '../utils/auditLog.js';

/**
 * Helper function to increment category usage
 * Called when a question is created with this category
 */
export const incrementCategoryUsage = async (categoryName) => {
  try {
    await Category.findOneAndUpdate(
      { name: categoryName.toLowerCase() },
      {
        $inc: { usageCount: 1 },
        lastUsedAt: new Date()
      }
    );
  } catch (error) {
    console.error('Error incrementing category usage:', error);
    // Don't throw - this is non-critical
  }
};

/**
 * Get categories for dropdown (8 defaults + top 5 custom by usage)
 */
export const getCategories = async (req, res) => {
  try {
    // Get all default categories
    const defaultCategories = await Category.find({ isDefault: true })
      .sort({ createdAt: 1 });

    // Get top 5 custom categories by usage count
    const customCategories = await Category.find({ isDefault: false })
      .sort({ usageCount: -1, lastUsedAt: -1 })
      .limit(5);

    // Combine: defaults first, then custom
    const allCategories = [...defaultCategories, ...customCategories];

    res.json({
      success: true,
      categories: allCategories,
      count: allCategories.length,
      info: {
        defaultCount: defaultCategories.length,
        customCount: customCategories.length,
        maxCustom: 5
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Create a new category
 */
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category already exists (case-insensitive)
    const existingCategory = await Category.findOne({ name: name.trim().toLowerCase() });
    if (existingCategory) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    const category = await Category.create({
      name: name.trim().toLowerCase(),
      description,
      createdBy: req.user.id,
      isDefault: false
    });

    await logAuditEvent(
      req,
      req.user.id,
      'category_created',
      'Category',
      category._id,
      null,
      `Created category: ${category.name}`
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get category by name
 */
export const getCategoryByName = async (req, res) => {
  try {
    const { name } = req.params;
    const category = await Category.findOne({ name: name.toLowerCase() });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete category (only if created by user, not default)
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.isDefault) {
      return res.status(403).json({ error: 'Cannot delete default categories' });
    }

    if (category.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own categories' });
    }

    await Category.findByIdAndDelete(id);

    await logAuditEvent(
      req,
      req.user.id,
      'category_deleted',
      'Category',
      id,
      null,
      `Deleted category: ${category.name}`
    );

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Check if category exists
 */
export const checkCategoryExists = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await Category.findOne({ name: name.trim().toLowerCase() });

    res.json({
      success: true,
      exists: !!category,
      category: category || null
    });
  } catch (error) {
    console.error('Error checking category:', error);
    res.status(500).json({ error: error.message });
  }
};
