import dayjs from 'dayjs';
import { Exam } from '../models/Exam.js';
import { Registration } from '../models/Registration.js';
import { Result } from '../models/Result.js';
import { aesDecrypt } from '../utils/crypto.js';

export const listApprovedExams = async (req, res) => {
  try {
    // Disable caching for this endpoint
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    console.log('Student listApprovedExams called by user:', req.user);
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
    
    console.log(`Found ${exams.length} approved exams`);
    
    // Check which exams the student is already registered for
    const registrations = await Registration.find({ student: req.user.id }).select('exam');
    const registeredExamIds = registrations.map(r => r.exam.toString());
    
    console.log(`Student has ${registrations.length} registrations`);
    
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
    
    console.log('Returning exam data:', examData);
    res.status(200).json(examData);
  } catch (error) {
    console.error('Error in listApprovedExams:', error);
    res.status(500).json({ error: 'Failed to fetch exams', details: error.message });
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

    const now = dayjs.utc();
    
    // Check if exam is available for registration
    if (exam.availableFrom && dayjs.utc(exam.availableFrom).isAfter(now)) {
      return res.status(400).json({ error: 'Exam registration not yet open' });
    }
    if (exam.availableTo && dayjs.utc(exam.availableTo).isBefore(now)) {
      return res.status(400).json({ error: 'Exam registration has closed' });
    }

    let startTime, endTime;
    
    if (exam.examStartTime && exam.examEndTime) {
      // Fixed schedule exam - all students take at same time
      startTime = dayjs.utc(exam.examStartTime);
      endTime = dayjs.utc(exam.examEndTime);
      
      // Validate that the scheduled time hasn't passed
      if (endTime.isBefore(now)) {
        return res.status(400).json({ error: 'Exam time has already passed' });
      }
    } else {
      // Flexible scheduling - find available slot
      const durationMinutes = exam.durationMinutes || 60;
      startTime = now.utc().add(1, 'hour').minute(0).second(0).millisecond(0);
      endTime = startTime.add(durationMinutes, 'minute');

      // Check for conflicts with other exams
      const regs = await Registration.find({ student: req.user.id });
      const overlaps = (s1, e1, s2, e2) => s1.isBefore(e2) && s2.isBefore(e1);

      let safe = false;
      let attempts = 0;
      while (!safe && attempts < 100) { // Prevent infinite loop
        safe = true;
        for (const r of regs) {
          const rs = dayjs.utc(r.startTime);
          const re = dayjs.utc(r.endTime);
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
  // Disable caching for this endpoint
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  const regs = await Registration.find({ student: req.user.id }).populate('exam', 'title status');
  res.status(200).json(regs);
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
    
    const now = dayjs.utc();
    const startTime = dayjs.utc(reg.startTime);
    const endTime = dayjs.utc(reg.endTime);
    
    // Check if it's too early
    if (now.isBefore(startTime)) {
      const minutesUntilStart = startTime.diff(now, 'minute');
      return res.status(403).json({ 
        error: 'Exam not yet available',
        message: `Exam starts in ${minutesUntilStart} minutes`,
        minutesUntilStart,
        startTime: startTime.toISOString(),
        currentServerTime: now.toISOString()
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
      const examScheduledStart = dayjs.utc(exam.examStartTime);
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
    const { answers, timeTaken } = req.body; // array of selected indices and time taken
    const reg = await Registration.findOne({ student: req.user.id, exam: examId });
    if (!reg) return res.status(403).json({ error: 'Not registered' });

    const exam = await Exam.findById(examId);

    const questions = [];
    for (const c of exam.chunks) {
      const payload = JSON.parse(aesDecrypt(c.iv, c.cipherText));
      questions.push(...payload.questions);
    }

    let score = 0;
    const detailedAnswers = [];
    
    questions.forEach((q, i) => {
      const studentAnswerIndex = answers && answers[i] !== null && answers[i] !== undefined ? answers[i] : null;
      const isCorrect = studentAnswerIndex === q.correctIndex;
      
      if (isCorrect) score += 1;
      
      detailedAnswers.push({
        questionIndex: i,
        questionText: q.text,
        options: q.options,
        correctAnswerIndex: q.correctIndex,
        correctAnswerText: q.options[q.correctIndex],
        studentAnswerIndex: studentAnswerIndex,
        studentAnswerText: studentAnswerIndex !== null ? q.options[studentAnswerIndex] : null,
        isCorrect: isCorrect,
        points: 1
      });
    });

    const total = questions.length;
    const percentage = Math.round((score / total) * 100);
    
    const result = await Result.findOneAndUpdate(
      { student: req.user.id, exam: exam._id },
      { 
        score, 
        total, 
        percentage,
        submittedAt: new Date(),
        answers: detailedAnswers,
        timeTaken: timeTaken || null,
        examDuration: exam.durationMinutes || null
      },
      { new: true, upsert: true }
    );

    res.json(result);
  } catch (e) {
    console.error('Error submitting exam:', e);
    res.status(500).json({ error: 'Failed to submit exam' });
  }
};

export const myResults = async (req, res) => {
  try {
    // Disable caching for this endpoint
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const results = await Result.find({ student: req.user.id })
      .populate('exam', 'title description durationMinutes showResults resultsReleaseType resultsReleaseDate resultsReleaseMessage examEndTime')
      .sort({ submittedAt: -1 })
      .limit(5);
    
    // Filter results based on release settings
    const visibleResults = results.map(result => {
      const exam = result.exam;
      const now = new Date();
      
      // Skip if exam doesn't exist (deleted)
      if (!exam) {
        return null;
      }
      
      // Check if results should be shown
      if (!exam.showResults) {
        return {
          ...result.toObject(),
          resultsHidden: true,
          hideReason: 'Results are not available for this exam'
        };
      }
      
      // Check result release timing
      let resultsAvailable = false;
      let hideReason = '';
      
      switch (exam.resultsReleaseType) {
        case 'immediate':
          resultsAvailable = true;
          break;
          
        case 'after_exam_ends':
          if (exam.examEndTime) {
            // Fixed schedule exam - check if exam end time has passed
            // Use getTime() for consistent UTC timestamp comparison
            resultsAvailable = now.getTime() >= new Date(exam.examEndTime).getTime();
            const endTime = new Date(exam.examEndTime);
            const month = String(endTime.getUTCMonth() + 1).padStart(2, '0');
            const day = String(endTime.getUTCDate()).padStart(2, '0');
            const year = endTime.getUTCFullYear();
            const hours = String(endTime.getUTCHours()).padStart(2, '0');
            const minutes = String(endTime.getUTCMinutes()).padStart(2, '0');
            const seconds = String(endTime.getUTCSeconds()).padStart(2, '0');
            hideReason = resultsAvailable ? '' : `Results will be available after ${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
          } else {
            // Flexible exam - results available immediately after submission
            resultsAvailable = true;
          }
          break;
          
        case 'custom_date':
          if (exam.resultsReleaseDate) {
            const releaseTime = new Date(exam.resultsReleaseDate);
            const examEndTime = exam.examEndTime ? new Date(exam.examEndTime) : new Date(result.submittedAt);
            
            // Results available only after BOTH exam ends AND custom release date
            resultsAvailable = now.getTime() >= releaseTime.getTime() && now.getTime() >= examEndTime.getTime();
            
            if (!resultsAvailable) {
              const waitUntil = releaseTime.getTime() > examEndTime.getTime() ? releaseTime : examEndTime;
              const month = String(waitUntil.getUTCMonth() + 1).padStart(2, '0');
              const day = String(waitUntil.getUTCDate()).padStart(2, '0');
              const year = waitUntil.getUTCFullYear();
              const hours = String(waitUntil.getUTCHours()).padStart(2, '0');
              const minutes = String(waitUntil.getUTCMinutes()).padStart(2, '0');
              const seconds = String(waitUntil.getUTCSeconds()).padStart(2, '0');
              hideReason = `Results will be available on ${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
            }
          } else {
            // Fallback to after exam ends if no custom date set
            resultsAvailable = exam.examEndTime ? now.getTime() >= new Date(exam.examEndTime).getTime() : true;
            hideReason = resultsAvailable ? '' : 'Results will be available after the exam ends';
          }
          break;
          
        default:
          resultsAvailable = true;
      }
      
      if (resultsAvailable) {
        return result.toObject();
      } else {
        return {
          _id: result._id,
          exam: {
            _id: exam._id,
            title: exam.title,
            description: exam.description
          },
          submittedAt: result.submittedAt,
          resultsHidden: true,
          hideReason: hideReason,
          resultsReleaseMessage: exam.resultsReleaseMessage
        };
      }
    }).filter(result => result !== null);
    
    res.status(200).json(visibleResults);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
};

export const getDetailedResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    
    // Disable caching for this endpoint
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const result = await Result.findOne({ 
      _id: resultId, 
      student: req.user.id 
    }).populate('exam', 'title description durationMinutes createdBy showResults resultsReleaseType resultsReleaseDate resultsReleaseMessage examEndTime');
    
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    
    // Check if result has detailed answers (for backward compatibility)
    if (!result.answers || result.answers.length === 0) {
      return res.status(400).json({ 
        error: 'Detailed results not available', 
        message: 'This exam was taken before detailed results were implemented' 
      });
    }
    
    // Check if detailed results should be shown (same logic as myResults)
    const exam = result.exam;
    const now = new Date();
    
    if (!exam || !exam.showResults) {
      return res.status(403).json({ 
        error: 'Results not available', 
        message: 'Detailed results are not available for this exam' 
      });
    }
    
    // Check result release timing
    let resultsAvailable = false;
    let hideReason = '';
    
    switch (exam.resultsReleaseType) {
      case 'immediate':
        resultsAvailable = true;
        break;
        
      case 'after_exam_ends':
        if (exam.examEndTime) {
          resultsAvailable = now.getTime() >= new Date(exam.examEndTime).getTime();
          hideReason = resultsAvailable ? '' : `Results will be available after ${new Date(exam.examEndTime).toLocaleString('en-GB', { hour12: false })}`;
        } else {
          resultsAvailable = true;
        }
        break;
        
      case 'custom_date':
        if (exam.resultsReleaseDate) {
          const releaseTime = new Date(exam.resultsReleaseDate);
          const examEndTime = exam.examEndTime ? new Date(exam.examEndTime) : new Date(result.submittedAt);
          
          resultsAvailable = now.getTime() >= releaseTime.getTime() && now.getTime() >= examEndTime.getTime();
          
          if (!resultsAvailable) {
            const waitUntil = releaseTime.getTime() > examEndTime.getTime() ? releaseTime : examEndTime;
            hideReason = `Results will be available on ${waitUntil.toLocaleString('en-GB', { hour12: false })}`;
          }
        } else {
          resultsAvailable = exam.examEndTime ? now.getTime() >= new Date(exam.examEndTime).getTime() : true;
        }
        break;
        
      default:
        resultsAvailable = true;
    }
    
    if (!resultsAvailable) {
      return res.status(403).json({ 
        error: 'Results not yet available', 
        message: hideReason,
        releaseMessage: exam.resultsReleaseMessage
      });
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching detailed result:', error);
    res.status(500).json({ error: 'Failed to fetch detailed result' });
  }
};
