import dayjs from 'dayjs';
import { Exam } from '../models/Exam.js';
import { Registration } from '../models/Registration.js';
import { Result } from '../models/Result.js';
import { aesDecrypt } from '../utils/crypto.js';

export const listApprovedExams = async (req, res) => {
  try {
    const now = new Date();
    
    // Find approved exams that are currently available for registration
    const exams = await Exam.find({ 
      status: 'approved',
      $or: [
        { availableFrom: { $lte: now }, availableTo: { $gte: now } },
        { availableFrom: null, availableTo: null }
      ]
    })
    .populate('createdBy', 'name email')
    .select('title description createdBy durationMinutes availableFrom availableTo examStartTime examEndTime questions allowLateEntry createdAt');
    
    // Check which exams the student is already registered for
    const registrations = await Registration.find({ student: req.user.id }).select('exam');
    const registeredExamIds = registrations.map(r => r.exam.toString());
    
    const examData = exams.map(exam => ({
      _id: exam._id, // Keep original _id for compatibility
      id: exam._id,
      title: exam.title,
      description: exam.description,
      createdBy: exam.createdBy,
      durationMinutes: exam.durationMinutes,
      questionCount: exam.questions?.length || 0,
      availableFrom: exam.availableFrom,
      availableTo: exam.availableTo,
      examStartTime: exam.examStartTime,
      examEndTime: exam.examEndTime,
      allowLateEntry: exam.allowLateEntry,
      createdAt: exam.createdAt,
      isRegistered: registeredExamIds.includes(exam._id.toString())
    }));
    
    res.json(examData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
};

export const registerForExam = async (req, res) => {
  try {
    const { examId } = req.body;
    const exam = await Exam.findById(examId);
    if (!exam || exam.status !== 'approved') {
      return res.status(404).json({ error: 'Exam not available' });
    }

    // Check if student is already registered for this exam
    const existingReg = await Registration.findOne({ student: req.user.id, exam: examId });
    if (existingReg) {
      return res.status(409).json({ error: 'Already registered for this exam' });
    }

    const now = dayjs();
    
    // Check if exam is available for registration
    if (exam.availableFrom && dayjs(exam.availableFrom).isAfter(now)) {
      return res.status(400).json({ error: 'Exam registration not yet open' });
    }
    if (exam.availableTo && dayjs(exam.availableTo).isBefore(now)) {
      return res.status(400).json({ error: 'Exam registration has closed' });
    }

    let startTime, endTime;
    
    if (exam.examStartTime && exam.examEndTime) {
      // Fixed schedule exam - all students take at same time
      startTime = dayjs(exam.examStartTime);
      endTime = dayjs(exam.examEndTime);
      
      // Validate that the scheduled time hasn't passed
      if (endTime.isBefore(now)) {
        return res.status(400).json({ error: 'Exam time has already passed' });
      }
    } else {
      // Flexible scheduling - find available slot
      const durationMinutes = exam.durationMinutes || 60;
      startTime = now.add(1, 'hour').minute(0).second(0).millisecond(0);
      endTime = startTime.add(durationMinutes, 'minute');

      // Check for conflicts with other exams
      const regs = await Registration.find({ student: req.user.id });
      const overlaps = (s1, e1, s2, e2) => s1.isBefore(e2) && s2.isBefore(e1);

      let safe = false;
      let attempts = 0;
      while (!safe && attempts < 100) { // Prevent infinite loop
        safe = true;
        for (const r of regs) {
          const rs = dayjs(r.startTime);
          const re = dayjs(r.endTime);
          if (overlaps(startTime, endTime, rs, re)) {
            startTime = re.add(30, 'minute'); // 30 min buffer between exams
            endTime = startTime.add(durationMinutes, 'minute');
            safe = false;
            break;
          }
        }
        attempts++;
      }

      if (!safe) {
        return res.status(400).json({ error: 'Unable to find available time slot' });
      }
    }

    const registration = await Registration.create({ 
      student: req.user.id, 
      exam: exam._id, 
      startTime: startTime.toDate(), 
      endTime: endTime.toDate() 
    });

    // Populate exam details for response
    await registration.populate('exam', 'title durationMinutes');
    
    res.json({
      id: registration._id,
      exam: registration.exam,
      startTime: registration.startTime,
      endTime: registration.endTime,
      status: 'registered',
      message: exam.examStartTime ? 
        'Registered for scheduled exam' : 
        'Registered - you can start the exam during your allocated time'
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to register for exam' });
  }
};

export const getScheduledExams = async (req, res) => {
  const regs = await Registration.find({ student: req.user.id }).populate('exam', 'title status');
  res.json(regs);
};

export const accessExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const reg = await Registration.findOne({ student: req.user.id, exam: examId });
    if (!reg) {
      return res.status(403).json({ error: 'Not registered for this exam' });
    }
    
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    const now = dayjs();
    const startTime = dayjs(reg.startTime);
    const endTime = dayjs(reg.endTime);
    
    // Check if it's too early
    if (now.isBefore(startTime)) {
      const minutesUntilStart = startTime.diff(now, 'minute');
      return res.status(403).json({ 
        error: 'Exam not yet available',
        message: `Exam starts in ${minutesUntilStart} minutes at ${startTime.format('HH:mm')}`,
        startTime: startTime.toISOString()
      });
    }
    
    // Check if it's too late
    if (now.isAfter(endTime)) {
      return res.status(403).json({ 
        error: 'Exam time has expired',
        message: 'The allocated time for this exam has passed'
      });
    }
    
    // Check if late entry is allowed for scheduled exams
    if (exam.examStartTime && !exam.allowLateEntry) {
      const examScheduledStart = dayjs(exam.examStartTime);
      const lateThresholdMinutes = 15; // Allow 15 minutes late entry buffer
      
      if (now.isAfter(examScheduledStart.add(lateThresholdMinutes, 'minute'))) {
        return res.status(403).json({ 
          error: 'Late entry not permitted',
          message: `This exam started at ${examScheduledStart.format('HH:mm')} and late entry is not allowed`
        });
      }
    }

    // Check if student has already submitted
    const existingResult = await Result.findOne({ student: req.user.id, exam: examId });
    if (existingResult) {
      return res.status(400).json({ 
        error: 'Exam already completed',
        message: 'You have already submitted this exam'
      });
    }

    const questions = [];
    for (const c of exam.chunks) {
      const payload = JSON.parse(aesDecrypt(c.iv, c.cipherText));
      questions.push(...payload.questions);
    }

    let sanitized = questions.map((q, idx) => ({ 
      id: idx, 
      text: q.text, 
      options: q.options 
    }));

    // Shuffle questions if enabled
    if (exam.shuffleQuestions) {
      sanitized = sanitized.sort(() => Math.random() - 0.5);
    }

    // Calculate remaining time
    const remainingMinutes = endTime.diff(now, 'minute');
    const remainingSeconds = endTime.diff(now, 'second') % 60;

    res.json({ 
      exam: { 
        id: exam._id, 
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        questionCount: sanitized.length
      }, 
      questions: sanitized,
      timing: {
        startTime: reg.startTime,
        endTime: reg.endTime,
        remainingMinutes,
        remainingSeconds,
        serverTime: now.toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to access exam' });
  }
};

export const submitExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body; // array of selected indices
    const reg = await Registration.findOne({ student: req.user.id, exam: examId });
    if (!reg) return res.status(403).json({ error: 'Not registered' });

    const exam = await Exam.findById(examId);

    const questions = [];
    for (const c of exam.chunks) {
      const payload = JSON.parse(aesDecrypt(c.iv, c.cipherText));
      questions.push(...payload.questions);
    }

    let score = 0;
    questions.forEach((q, i) => {
      if (answers && answers[i] === q.correctIndex) score += 1;
    });

    const total = questions.length;
    const result = await Result.findOneAndUpdate(
      { student: req.user.id, exam: exam._id },
      { score, total, submittedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to submit exam' });
  }
};

export const myResults = async (req, res) => {
  const results = await Result.find({ student: req.user.id }).populate('exam', 'title');
  res.json(results);
};
