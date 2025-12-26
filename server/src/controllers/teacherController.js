import { Exam } from '../models/Exam.js';
import { Result } from '../models/Result.js';
import { sha256, aesEncrypt } from '../utils/crypto.js';
import { logAuditEvent, extractChanges } from '../utils/auditLog.js';

export const createExam = async (req, res) => {
  try {
    const { 
      title, 
      description = '', 
      durationMinutes = 60,
      availableFrom,
      availableTo,
      examStartTime,
      examEndTime,
      allowLateEntry = false,
      shuffleQuestions = false,
      showResults = true,
      resultsReleaseType = 'after_exam_ends',
      resultsReleaseDate,
      resultsReleaseMessage = ''
    } = req.body;
    
    const exam = await Exam.create({ 
      title, 
      description,
      createdBy: req.user.id, 
      status: 'draft',
      durationMinutes,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      availableTo: availableTo ? new Date(availableTo) : null,
      examStartTime: examStartTime ? new Date(examStartTime) : null,
      examEndTime: examEndTime ? new Date(examEndTime) : null,
      allowLateEntry,
      shuffleQuestions,
      showResults,
      resultsReleaseType,
      resultsReleaseDate: resultsReleaseDate ? new Date(resultsReleaseDate) : null,
      resultsReleaseMessage
    });
    
    // Log audit event
    await logAuditEvent(
      req,
      req.user.id,
      'exam_created',
      'Exam',
      exam._id,
      null,
      `Title: ${title}`,
      'success'
    );
    
    res.json(exam);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create exam' });
  }
};

export const addQuestion = async (req, res) => {
  try {
    const { examId } = req.params;
    const { text, options, correctIndex } = req.body;
    const exam = await Exam.findOne({ _id: examId, createdBy: req.user.id });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (exam.status !== 'draft') return res.status(400).json({ error: 'Cannot modify finalized exam' });
    exam.questions.push({ text, options, correctIndex });
    await exam.save();
    res.json(exam);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add question' });
  }
};

function splitIntoChunks(arr, parts) {
  const result = [];
  const size = Math.ceil(arr.length / parts);
  for (let i = 0; i < parts; i++) {
    const start = i * size;
    const end = start + size;
    const chunk = arr.slice(start, end);
    if (chunk.length) result.push(chunk);
  }
  return result;
}

export const finalizeExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findOne({ _id: examId, createdBy: req.user.id });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (exam.questions.length === 0) return res.status(400).json({ error: 'No questions to finalize' });

    const parts = 5;
    const questionChunks = splitIntoChunks(exam.questions, parts);

    const chunks = [];
    let prevHash = 'GENESIS';

    questionChunks.forEach((qChunk, index) => {
      const payload = JSON.stringify({ questions: qChunk, prevHash, index });
      const currHash = sha256(payload);
      const enc = aesEncrypt(payload);
      chunks.push({ index, prevHash, hash: currHash, iv: enc.iv, cipherText: enc.cipherText });
      prevHash = currHash;
    });

    exam.chunks = chunks;
    exam.status = 'pending'; // Send to admin for approval
    exam.isFinalized = true;
    exam.finalizedAt = new Date();
    await exam.save();

    console.log(`✅ FINALIZE SUCCESS: Exam ${examId} status set to PENDING for admin approval`);

    // Log audit event
    await logAuditEvent(
      req,
      req.user.id,
      'exam_finalized',
      'Exam',
      exam._id,
      null,
      `Questions: ${exam.questions.length}, Chunks: ${chunks.length}`,
      'success'
    );

    res.json({ examId: exam._id, chunks: chunks.map(c => ({ index: c.index, hash: c.hash, prevHash: c.prevHash })) });
  } catch (e) {
    console.error('❌ FINALIZE FAILED:', e);
    res.status(500).json({ error: 'Failed to finalize exam' });
  }
};

export const updateExamSettings = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findOne({ _id: examId, createdBy: req.user.id });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (exam.status !== 'draft') return res.status(400).json({ error: 'Cannot modify finalized exam' });
    
    const { 
      title, 
      description,
      durationMinutes,
      availableFrom,
      availableTo,
      examStartTime,
      examEndTime,
      allowLateEntry,
      shuffleQuestions,
      showResults,
      resultsReleaseType,
      resultsReleaseDate,
      resultsReleaseMessage
    } = req.body;
    
    if (title !== undefined) exam.title = title;
    if (description !== undefined) exam.description = description;
    if (durationMinutes !== undefined) exam.durationMinutes = durationMinutes;
    if (availableFrom !== undefined) exam.availableFrom = availableFrom ? new Date(availableFrom) : null;
    if (availableTo !== undefined) exam.availableTo = availableTo ? new Date(availableTo) : null;
    if (examStartTime !== undefined) exam.examStartTime = examStartTime ? new Date(examStartTime) : null;
    if (examEndTime !== undefined) exam.examEndTime = examEndTime ? new Date(examEndTime) : null;
    if (allowLateEntry !== undefined) exam.allowLateEntry = allowLateEntry;
    if (shuffleQuestions !== undefined) exam.shuffleQuestions = shuffleQuestions;
    if (showResults !== undefined) exam.showResults = showResults;
    if (resultsReleaseType !== undefined) exam.resultsReleaseType = resultsReleaseType;
    if (resultsReleaseDate !== undefined) exam.resultsReleaseDate = resultsReleaseDate ? new Date(resultsReleaseDate) : null;
    if (resultsReleaseMessage !== undefined) exam.resultsReleaseMessage = resultsReleaseMessage;
    
    await exam.save();
    res.json(exam);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update exam settings' });
  }
};

export const listMyExams = async (req, res) => {
  const exams = await Exam.find({ createdBy: req.user.id }).select('-chunks.cipherText -chunks.iv');
  res.json(exams);
};

export const deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findOne({ _id: examId, createdBy: req.user.id });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    // Only allow deletion of draft exams
    if (exam.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft exams can be deleted' });
    }
    
    await Exam.deleteOne({ _id: examId });
    res.json({ message: 'Exam deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete exam' });
  }
};

export const getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Verify exam exists and belongs to teacher
    const exam = await Exam.findOne({ _id: examId, createdBy: req.user.id });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    // Fetch all results for this exam with student and exam details
    const results = await Result.find({ exam: examId })
      .populate('student', 'name email phone')
      .populate('exam', 'title')
      .sort({ submittedAt: -1 });
    
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch exam results' });
  }
};
