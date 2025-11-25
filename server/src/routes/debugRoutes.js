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

// Get pending exams for admin approval
router.get('/pending-exams', async (req, res) => {
  try {
    const now = new Date();
    
    // Get all pending exams
    const pendingExams = await Exam.find({ status: 'pending' })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 }); // Most recent first
    
    // Check for expired exams (registration period has passed)
    const examsWithStatus = pendingExams.map(exam => {
      let canApprove = true;
      let expiryReason = null;
      
      // Check if registration period has started and admin hasn't approved yet
      if (exam.availableFrom && now >= new Date(exam.availableFrom)) {
        canApprove = false;
        expiryReason = 'Registration period has already started';
      }
      
      return {
        ...exam.toObject(),
        canApprove,
        expiryReason,
        isExpired: !canApprove
      };
    });
    
    res.json(examsWithStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending exams', details: error.message });
  }
});

// Approve/reject/expire exam
router.patch('/exam-status/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const { status } = req.body; // 'approved' | 'rejected' | 'expired'
    
    if (!['approved', 'rejected', 'expired'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    const now = new Date();
    
    // Check if exam can still be approved
    if (status === 'approved' && exam.status === 'pending') {
      let canApprove = true;
      let reason = null;
      
      if (exam.availableFrom && now >= new Date(exam.availableFrom)) {
        canApprove = false;
        reason = 'Registration period has already started';
      }
      
      if (!canApprove) {
        return res.status(400).json({ 
          error: 'Cannot approve exam', 
          reason: reason,
          suggestedStatus: 'expired'
        });
      }
    }
    
    exam.status = status;
    await exam.save();
    
    await exam.populate('createdBy', 'name email role');
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update exam status', details: error.message });
  }
});

// Fix pending exams (approve them) - legacy endpoint
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

// Demonstrate blockchain tampering detection
router.post('/tamper-exam/:examId', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development' });
  }
  
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    
    if (!exam || !exam.chunks || exam.chunks.length === 0) {
      return res.status(404).json({ error: 'Exam not found or not finalized' });
    }

    // Store original blockchain state
    const originalChunks = JSON.parse(JSON.stringify(exam.chunks));
    
    // Tamper with chunk 2 (index 1) - modify the encrypted content
    if (exam.chunks.length > 1) {
      const tamperedChunk = exam.chunks[1];
      const originalCipherText = tamperedChunk.cipherText;
      
      // Corrupt the encrypted data (simulate hacker modification)
      tamperedChunk.cipherText = Buffer.from(originalCipherText, 'base64')
        .toString('hex')
        .split('')
        .map(char => char === 'a' ? 'b' : char === '1' ? '2' : char)
        .join('')
        .substring(0, originalCipherText.length);
      
      // Convert back to base64
      tamperedChunk.cipherText = Buffer.from(tamperedChunk.cipherText.substring(0, 32), 'hex').toString('base64');
      
      await exam.save();
      
      res.json({
        message: 'Blockchain tampered! Chunk 2 data corrupted - hash chain integrity compromised',
        tamperingDetails: {
          chunkIndex: 1,
          originalCipherText: originalCipherText.substring(0, 50) + '...',
          tamperedCipherText: tamperedChunk.cipherText.substring(0, 50) + '...',
          expectedPrevHash: originalChunks[2] ? originalChunks[2].prevHash : 'N/A',
          actualHash: tamperedChunk.hash,
          integrityStatus: 'COMPROMISED - Hash chain broken!'
        },
        originalBlockchain: originalChunks.map(c => ({
          index: c.index,
          hash: c.hash.substring(0, 16) + '...',
          prevHash: c.prevHash.substring(0, 16) + '...'
        })),
        tamperedBlockchain: exam.chunks.map(c => ({
          index: c.index,
          hash: c.hash.substring(0, 16) + '...',
          prevHash: c.prevHash.substring(0, 16) + '...'
        }))
      });
    } else {
      res.status(400).json({ error: 'Need at least 2 chunks to demonstrate tampering' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to tamper with exam: ' + error.message });
  }
});

// Validate blockchain integrity
router.get('/validate-blockchain/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    
    if (!exam || !exam.chunks) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const validationResults = [];
    let isBlockchainValid = true;
    
    for (let i = 0; i < exam.chunks.length; i++) {
      const chunk = exam.chunks[i];
      const validation = {
        chunkIndex: i,
        hash: chunk.hash,
        prevHash: chunk.prevHash,
        isValid: true,
        issues: []
      };
      
      // Check if prevHash matches previous chunk's hash
      if (i > 0) {
        const prevChunk = exam.chunks[i - 1];
        if (chunk.prevHash !== prevChunk.hash) {
          validation.isValid = false;
          validation.issues.push(`prevHash mismatch: expected ${prevChunk.hash}, got ${chunk.prevHash}`);
          isBlockchainValid = false;
        }
      } else {
        // First chunk should have GENESIS
        if (chunk.prevHash !== 'GENESIS') {
          validation.isValid = false;
          validation.issues.push(`Genesis chunk prevHash should be 'GENESIS', got '${chunk.prevHash}'`);
          isBlockchainValid = false;
        }
      }
      
      // Try to decrypt and validate hash
      try {
        const { aesDecrypt, sha256 } = await import('../utils/crypto.js');
        const decryptedPayload = aesDecrypt(chunk.iv, chunk.cipherText);
        const parsedPayload = JSON.parse(decryptedPayload);
        const calculatedHash = sha256(decryptedPayload);
        
        if (calculatedHash !== chunk.hash) {
          validation.isValid = false;
          validation.issues.push(`Hash mismatch: calculated ${calculatedHash}, stored ${chunk.hash}`);
          isBlockchainValid = false;
        }
      } catch (decryptError) {
        validation.isValid = false;
        validation.issues.push(`Decryption failed: ${decryptError.message}`);
        isBlockchainValid = false;
      }
      
      validationResults.push(validation);
    }
    
    res.json({
      examId,
      examTitle: exam.title,
      blockchainStatus: isBlockchainValid ? 'VALID' : 'COMPROMISED',
      totalChunks: exam.chunks.length,
      validChunks: validationResults.filter(v => v.isValid).length,
      invalidChunks: validationResults.filter(v => !v.isValid).length,
      validationDetails: validationResults,
      securityAssessment: isBlockchainValid 
        ? 'Blockchain integrity confirmed - no tampering detected'
        : '🚨 SECURITY BREACH DETECTED - Blockchain has been compromised!'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate blockchain: ' + error.message });
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