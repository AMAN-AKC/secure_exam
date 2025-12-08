import { Exam } from '../models/Exam.js';
import { logAuditEvent } from '../utils/auditLog.js';

/**
 * Get question preview for exam (formatted for display)
 */
export const getQuestionPreview = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId).populate('createdBy', 'name email');

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Check access
    if (exam.createdBy._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only preview your own exams' });
    }

    // Format questions for preview
    const formattedQuestions = exam.questions.map((q, idx) => ({
      number: idx + 1,
      text: q.text,
      options: q.options.map((opt, optIdx) => ({
        letter: String.fromCharCode(65 + optIdx), // A, B, C, D
        text: opt,
        isCorrect: optIdx === q.correctIndex
      })),
      correctAnswer: String.fromCharCode(65 + q.correctIndex),
      points: q.points,
      negativeMark: q.negativeMark,
      partialCredit: q.partialCredit
    }));

    res.json({
      success: true,
      preview: {
        examId: exam._id,
        title: exam.title,
        description: exam.description,
        totalQuestions: exam.questions.length,
        totalPoints: exam.questions.reduce((sum, q) => sum + q.points, 0),
        durationMinutes: exam.durationMinutes,
        questions: formattedQuestions,
        status: exam.status,
        isFinalized: exam.isFinalized,
        isPreviewComplete: exam.isPreviewComplete
      }
    });
  } catch (error) {
    console.error('Error getting preview:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark preview as complete
 */
export const completePreview = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only preview your own exams' });
    }

    if (exam.questions.length === 0) {
      return res.status(400).json({ error: 'Exam must have at least one question' });
    }

    exam.isPreviewComplete = true;
    exam.previewedBy = req.user.id;
    exam.previewedAt = new Date();
    await exam.save();

    await logAuditEvent(req, req.user.id, 'exam_preview_completed', 'Exam', examId, null, `Completed preview for exam: ${exam.title}`);

    res.json({
      message: 'Preview completed successfully',
      exam
    });
  } catch (error) {
    console.error('Error completing preview:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Finalize exam (lock it from further modifications)
 */
export const finalizeExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only finalize your own exams' });
    }

    if (!exam.isPreviewComplete) {
      return res.status(400).json({ error: 'You must complete preview before finalizing' });
    }

    if (exam.questions.length === 0) {
      return res.status(400).json({ error: 'Exam must have at least one question' });
    }

    exam.isFinalized = true;
    exam.finalizedAt = new Date();
    exam.status = 'pending'; // Mark as pending admin approval
    await exam.save();

    await logAuditEvent(req, req.user.id, 'exam_finalized', 'Exam', examId, null, `Finalized exam: ${exam.title}`);

    res.json({
      message: 'Exam finalized successfully and submitted for approval',
      exam
    });
  } catch (error) {
    console.error('Error finalizing exam:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update question marking system
 */
export const updateQuestionMarking = async (req, res) => {
  try {
    const { examId, questionIndex } = req.params;
    const { points, negativeMark, partialCredit } = req.body;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.isFinalized) {
      return res.status(403).json({ error: 'Cannot modify a finalized exam' });
    }

    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only modify your own exams' });
    }

    const idx = parseInt(questionIndex);
    if (idx < 0 || idx >= exam.questions.length) {
      return res.status(400).json({ error: 'Invalid question index' });
    }

    // Update marking
    exam.questions[idx].points = points || 1;
    exam.questions[idx].negativeMark = negativeMark || 0;
    exam.questions[idx].partialCredit = partialCredit || false;

    await exam.save();

    await logAuditEvent(req, req.user.id, 'exam_question_marking_updated', 'Exam', examId, null, `Updated marking for question ${idx + 1}`);

    res.json({
      message: 'Question marking updated successfully',
      question: exam.questions[idx]
    });
  } catch (error) {
    console.error('Error updating marking:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get exam statistics and marking summary
 */
export const getExamMarkingStats = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
    const totalNegativeMark = exam.questions.reduce((sum, q) => sum + q.negativeMark, 0);
    const questionsWithPartialCredit = exam.questions.filter(q => q.partialCredit).length;

    const markingScheme = {
      totalQuestions: exam.questions.length,
      totalPoints,
      averagePoints: (totalPoints / exam.questions.length).toFixed(2),
      totalNegativeMark,
      questionsWithPartialCredit,
      questions: exam.questions.map((q, idx) => ({
        number: idx + 1,
        points: q.points,
        negativeMark: q.negativeMark,
        partialCredit: q.partialCredit
      }))
    };

    res.json({
      success: true,
      markingScheme,
      maxScore: totalPoints,
      minScore: exam.questions.some(q => q.negativeMark > 0) ? totalNegativeMark * -1 : 0
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Import questions from question bank
 */
export const importFromQuestionBank = async (req, res) => {
  try {
    const { examId } = req.params;
    const { questionIds } = req.body;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.isFinalized) {
      return res.status(403).json({ error: 'Cannot modify a finalized exam' });
    }

    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only modify your own exams' });
    }

    if (!questionIds || questionIds.length === 0) {
      return res.status(400).json({ error: 'No questions selected' });
    }

    // Import would require importing QuestionBank model
    // For now, returning template for implementation
    res.json({
      message: 'Question import feature coming soon',
      selectedQuestions: questionIds.length
    });
  } catch (error) {
    console.error('Error importing questions:', error);
    res.status(500).json({ error: error.message });
  }
};
