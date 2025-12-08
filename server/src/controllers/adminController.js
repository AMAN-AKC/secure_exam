import { Exam } from '../models/Exam.js';
import { logAuditEvent } from '../utils/auditLog.js';

export const listAllExams = async (_req, res) => {
  const exams = await Exam.find().populate('createdBy', 'name email role');
  res.json(exams);
};

export const getPendingExams = async (_req, res) => {
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
      
      // Check if exam is scheduled to start soon (within 24 hours)
      if (exam.examStartTime && now >= new Date(new Date(exam.examStartTime).getTime() - 60 * 60 * 1000)) {
        canApprove = false;
        expiryReason = 'Exam is scheduled to start within 1 hour';
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
};

export const setExamStatus = async (req, res) => {
  try {
    const { examId } = req.params;
    const { status, notes, conditions } = req.body; // 'approved' | 'rejected' | 'expired'
    
    if (!['approved', 'rejected', 'expired'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    const now = new Date();
    const oldStatus = exam.status;
    
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
    
    // Store status change with approval/rejection details
    exam.status = status;
    
    if (status === 'approved') {
      exam.approvalNotes = notes || null;
      exam.approvalConditions = conditions || null;
      exam.approvedBy = req.user.id;
      exam.approvedAt = now;
      // Clear rejection fields if changing from rejected to approved
      exam.rejectionReason = null;
      exam.rejectedBy = null;
      exam.rejectedAt = null;
    } else if (status === 'rejected') {
      exam.rejectionReason = notes || 'No reason provided';
      exam.rejectedBy = req.user.id;
      exam.rejectedAt = now;
      // Clear approval fields if changing from approved to rejected
      exam.approvalNotes = null;
      exam.approvalConditions = null;
      exam.approvedBy = null;
      exam.approvedAt = null;
    }
    
    await exam.save();
    
    // Log audit event with all details
    await logAuditEvent(
      req,
      req.user.id,
      status === 'approved' ? 'exam_approved' : status === 'rejected' ? 'exam_rejected' : 'exam_expired',
      'Exam',
      exam._id,
      { 
        before: { status: oldStatus }, 
        after: { 
          status,
          notes: notes || null,
          conditions: conditions || null
        }
      },
      notes || null,
      'success'
    );

    await exam.populate('createdBy', 'name email role').populate('approvedBy', 'name email').populate('rejectedBy', 'name email');
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update exam status', details: error.message });
  }
};

/**
 * Get audit logs for admin dashboard
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { limit = 100, action, actor, targetType, startDate, endDate } = req.query;

    const { AuditLog } = await import('../models/AuditLog.js');

    let query = {};

    // Filter by action if provided
    if (action) {
      query.action = action;
    }

    // Filter by actor if provided
    if (actor) {
      query.actor = actor;
    }

    // Filter by targetType if provided
    if (targetType) {
      query.targetType = targetType;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const logs = await AuditLog.find(query)
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit) || 100, 1000));

    res.json({
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs', details: error.message });
  }
};

/**
 * Soft delete a result (mark as deleted, don't actually remove)
 */
export const softDeleteResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { reason } = req.body;

    const { Result } = await import('../models/Result.js');

    const result = await Result.findById(resultId);

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (result.isDeleted) {
      return res.status(400).json({ error: 'Result is already deleted' });
    }

    // Soft delete
    await result.softDelete(req.user.id, reason || 'Deleted by admin');

    // Log deletion
    await logAuditEvent(
      req,
      req.user.id,
      'result_deleted',
      'Result',
      resultId,
      {
        before: { isDeleted: false },
        after: { isDeleted: true, reason: reason || 'Deleted by admin' }
      },
      reason || 'Soft deleted by admin'
    );

    res.json({
      success: true,
      message: 'Result soft deleted successfully',
      result: {
        _id: result._id,
        isDeleted: true,
        deletedAt: result.deletedAt,
        deletedBy: result.deletedBy
      }
    });
  } catch (error) {
    console.error('Error soft deleting result:', error);
    res.status(500).json({ error: 'Failed to delete result', details: error.message });
  }
};

/**
 * Restore a soft-deleted result
 */
export const restoreResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { reason } = req.body;

    const { Result } = await import('../models/Result.js');

    const result = await Result.findById(resultId);

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (!result.isDeleted) {
      return res.status(400).json({ error: 'Result is not deleted' });
    }

    // Restore
    const previousDeletedAt = result.deletedAt;
    result.isDeleted = false;
    result.deletedAt = null;
    result.deletedBy = null;
    result.deletionReason = null;
    await result.save();

    // Log restoration
    await logAuditEvent(
      req,
      req.user.id,
      'result_restored',
      'Result',
      resultId,
      {
        before: { isDeleted: true, deletedAt: previousDeletedAt },
        after: { isDeleted: false }
      },
      reason || 'Restored by admin'
    );

    res.json({
      success: true,
      message: 'Result restored successfully',
      result: {
        _id: result._id,
        isDeleted: false
      }
    });
  } catch (error) {
    console.error('Error restoring result:', error);
    res.status(500).json({ error: 'Failed to restore result', details: error.message });
  }
};

/**
 * Get list of deleted results
 */
export const getDeletedResults = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const { Result } = await import('../models/Result.js');

    const deletedResults = await Result.find({ isDeleted: true })
      .populate('student', 'name email')
      .populate('exam', 'title')
      .populate('deletedBy', 'name email')
      .sort({ deletedAt: -1 })
      .limit(Math.min(parseInt(limit) || 50, 1000));

    res.json({
      count: deletedResults.length,
      results: deletedResults
    });
  } catch (error) {
    console.error('Error fetching deleted results:', error);
    res.status(500).json({ error: 'Failed to fetch deleted results', details: error.message });
  }
};
