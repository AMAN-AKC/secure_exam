import { QuestionBank } from '../models/QuestionBank.js';
import { incrementCategoryUsage } from './categoryController.js';
import { logAuditEvent } from '../utils/auditLog.js';

/**
 * Create a new question in the bank
 */
export const createQuestion = async (req, res) => {
  try {
    const { title, category, difficulty, tags, content, options, points, negativeMark, description, source } = req.body;

    // Validate options
    if (!options || options.length < 2 || options.length > 6) {
      return res.status(400).json({ error: 'Question must have 2-6 options' });
    }

    const hasCorrectAnswer = options.some(opt => opt.isCorrect);
    if (!hasCorrectAnswer) {
      return res.status(400).json({ error: 'Question must have at least one correct answer' });
    }

    const question = await QuestionBank.create({
      title,
      category,
      difficulty,
      tags,
      content,
      options,
      points,
      negativeMark,
      description,
      source,
      creator: req.user.id,
      createdBy: `${req.user.name} (${req.user.role})`,
      status: req.user.role === 'admin' ? 'approved' : 'pending_review'
    });

    // Increment category usage count
    await incrementCategoryUsage(category);

    await logAuditEvent(req, req.user.id, 'question_bank_created', 'QuestionBank', question._id, null, `Created question: ${title}`);

    res.status(201).json({
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all questions with filtering and search
 */
export const getQuestions = async (req, res) => {
  try {
    const { category, difficulty, status, search, tags, page = 1, limit = 20 } = req.query;

    const filters = {
      isDeleted: false,
      ...(category && { category }),
      ...(difficulty && { difficulty }),
      ...(status && { status }),
      ...(tags && { tags: { $in: tags.split(',') } })
    };

    let query = QuestionBank.find(filters);

    if (search) {
      query = query.where({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const total = await QuestionBank.countDocuments(filters);
    const questions = await query
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      questions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get question by ID
 */
export const getQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await QuestionBank.findOne({ _id: id, isDeleted: false })
      .populate('creator', 'name email')
      .populate('approvedBy', 'name email');

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update question (only if not approved)
 */
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await QuestionBank.findById(id);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.isApproved) {
      return res.status(403).json({ error: 'Cannot modify an approved question' });
    }

    if (question.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own questions' });
    }

    const updated = await QuestionBank.findByIdAndUpdate(id, req.body, { new: true });

    await logAuditEvent(req, req.user.id, 'question_bank_modified', 'QuestionBank', id, null, `Updated question: ${question.title}`);

    res.json({
      message: 'Question updated successfully',
      question: updated
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete question (soft delete)
 */
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await QuestionBank.findById(id);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own questions' });
    }

    question.isDeleted = true;
    question.deletedAt = new Date();
    await question.save();

    await logAuditEvent(req, req.user.id, 'question_bank_deleted', 'QuestionBank', id, null, `Deleted question: ${question.title}`);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Approve question (admin only)
 */
export const approveQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can approve questions' });
    }

    const question = await QuestionBank.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        isApproved: true,
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await logAuditEvent(req, req.user.id, 'question_bank_approved', 'QuestionBank', id, null, `Approved question: ${question.title}`);

    res.json({
      message: 'Question approved successfully',
      question
    });
  } catch (error) {
    console.error('Error approving question:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get questions by category
 */
export const getQuestionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const questions = await QuestionBank.find({ category, isDeleted: false, status: 'approved' })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ difficulty: 1, createdAt: -1 });

    const total = await QuestionBank.countDocuments({ category, isDeleted: false, status: 'approved' });

    res.json({
      success: true,
      category,
      questions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get questions by difficulty
 */
export const getQuestionsByDifficulty = async (req, res) => {
  try {
    const { difficulty } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const questions = await QuestionBank.find({ difficulty, isDeleted: false, status: 'approved' })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await QuestionBank.countDocuments({ difficulty, isDeleted: false, status: 'approved' });

    res.json({
      success: true,
      difficulty,
      questions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get question statistics
 */
export const getQuestionStats = async (req, res) => {
  try {
    const stats = await QuestionBank.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          approvedQuestions: {
            $sum: { $cond: [{ $eq: ['$isApproved', true] }, 1, 0] }
          },
          byCategory: {
            $push: { category: '$category', count: 1 }
          },
          byDifficulty: {
            $push: { difficulty: '$difficulty', count: 1 }
          },
          avgSuccessRate: { $avg: '$successRate' },
          totalUsage: { $sum: '$usageCount' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalQuestions: 0,
        approvedQuestions: 0,
        avgSuccessRate: 0,
        totalUsage: 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
};
