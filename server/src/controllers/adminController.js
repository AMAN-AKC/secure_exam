import { Exam } from '../models/Exam.js';

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
};
