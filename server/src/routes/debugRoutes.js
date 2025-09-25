import { Router } from 'express';
import { User } from '../models/User.js';
import { Exam } from '../models/Exam.js';
import { Registration } from '../models/Registration.js';
import { Result } from '../models/Result.js';

const router = Router();

// Get all users (admin only in production)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
    res.json({
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all exams
router.get('/exams', async (req, res) => {
  try {
    const exams = await Exam.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      count: exams.length,
      exams: exams.map(exam => ({
        id: exam._id,
        title: exam.title,
        status: exam.status,
        createdBy: exam.createdBy,
        questionsCount: exam.questions?.length || 0,
        chunksCount: exam.chunks?.length || 0,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Get all registrations
router.get('/registrations', async (req, res) => {
  try {
    const registrations = await Registration.find({})
      .populate('student', 'name email')
      .populate('exam', 'title')
      .sort({ createdAt: -1 });
    
    res.json({
      count: registrations.length,
      registrations
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Get all results
router.get('/results', async (req, res) => {
  try {
    const results = await Result.find({})
      .populate('student', 'name email')
      .populate('exam', 'title')
      .sort({ submittedAt: -1 });
    
    res.json({
      count: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Get database statistics
router.get('/stats', async (req, res) => {
  try {
    const [userCount, examCount, regCount, resultCount] = await Promise.all([
      User.countDocuments(),
      Exam.countDocuments(),
      Registration.countDocuments(),
      Result.countDocuments()
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const examsByStatus = await Exam.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      collections: {
        users: userCount,
        exams: examCount,
        registrations: regCount,
        results: resultCount
      },
      usersByRole: usersByRole.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      examsByStatus: examsByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Clear all test data (development only)
router.delete('/clear-test-data', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development' });
  }
  
  try {
    // Delete test users (emails containing 'test' or 'debug')
    const deleteResult = await User.deleteMany({
      email: { $regex: /(test|debug)/i }
    });

    res.json({
      message: 'Test data cleared',
      deletedUsers: deleteResult.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear test data' });
  }
});

// Fix pending exams (approve them)
router.post('/fix-pending-exams', async (req, res) => {
  try {
    const updateResult = await Exam.updateMany(
      { status: 'pending' },
      { status: 'approved' }
    );

    res.json({
      message: 'Fixed pending exams - approved them for student access',
      updated: updateResult.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fix pending exams' });
  }
});

// Reset entire database (development only)
router.delete('/reset-database', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development' });
  }
  
  try {
    // Delete all data from all collections
    const userResult = await User.deleteMany({});
    const examResult = await Exam.deleteMany({});
    const regResult = await Registration.deleteMany({});
    const resultResult = await Result.deleteMany({});

    res.json({
      message: 'Database reset complete - all data cleared',
      deleted: {
        users: userResult.deletedCount,
        exams: examResult.deletedCount,
        registrations: regResult.deletedCount,
        results: resultResult.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

export default router;