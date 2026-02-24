import asyncHandler from 'express-async-handler';
import ExamSession from '../models/examSessionModel.js';
import Exam from '../models/examModel.js';
import Result from '../models/resultModel.js';
import redis from '../db/redis.js';
import { createEvent } from './eventController.js';

// @desc    Start a new exam session
// @route   POST /api/exam-sessions/start
// @access  Private (Student)
export const startExam = asyncHandler(async (req, res) => {
  const { examId } = req.body;
  const studentId = req.user._id;

  const exam = await Exam.findById(examId);
  
  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  // Check for existing session
  const existingSession = await ExamSession.findOne({
    exam: examId,
    student: studentId,
    status: 'in-progress'
  });

  if (existingSession) {
    return res.status(200).json({
      success: true,
      message: 'Resumed existing exam session',
      data: existingSession
    });
  }

  // Create new exam session with violation tracking
  const examSession = await ExamSession.create({
    exam: examId,
    student: studentId,
    startTime: new Date(),
    answers: [],
    status: 'in-progress',
    timeRemaining: exam.settings?.timeLimit || exam.timeLimit || 60,
    
    // Violation tracking
    totalViolations: 0,
    violations: {
      tabSwitches: 0,
      windowBlurs: 0,
      fullscreenExits: 0,
      copyAttempts: 0,
      otherViolations: 0
    },
    integrityEvents: [],
    flagged: false,
    flagReason: null,
    
    // Browser info
    browserInfo: {
      userAgent: req.headers['user-agent'] || 'Unknown',
      platform: req.body.platform || 'Unknown',
      screenResolution: req.body.screenResolution || 'Unknown'
    },
    ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown'
  });

  await createEvent(req.user._id, 'start_exam', {
    examId: examId,
    sessionId: examSession._id
  });

  res.status(201).json({
    success: true,
    message: 'Exam session started successfully',
    data: examSession
  });
});

// @desc    Get exam session
// @route   GET /api/exam-sessions/:id
// @access  Private
export const getExamSession = asyncHandler(async (req, res) => {
  try {
    const cached = await redis.get(`exam_session:${req.params.id}`);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached)
      });
    }
  } catch (error) {
    // Redis unavailable, continue
  }

  const session = await ExamSession.findById(req.params.id)
    .populate({
      path: 'exam',
      select: 'title description questions settings timeLimit duration'
    })
    .populate('student', 'firstName lastName email');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found'
    });
  }

  if (session.student._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this session'
    });
  }

  await createEvent(req.user._id, 'view_question', {
    examId: session.exam._id,
    sessionId: session._id
  });

  res.json({
    success: true,
    data: session
  });
});

// @desc    Submit answer
// @route   POST /api/exam-sessions/:id/submit-answer
// @access  Private (Student)
export const submitAnswer = asyncHandler(async (req, res) => {
  const { questionId, answer, timeSpent, flagged } = req.body;

  const session = await ExamSession.findById(req.params.id).populate('exam');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found'
    });
  }

  if (session.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  if (session.status !== 'in-progress') {
    return res.status(400).json({
      success: false,
      message: 'Exam session is not active'
    });
  }

  // Find existing answer or create new
  const existingAnswerIndex = session.answers.findIndex(
    a => a.questionId.toString() === questionId
  );

  const answerData = {
    questionId,
    answer,
    timeSpent,
    flagged: flagged || false
  };

  if (existingAnswerIndex >= 0) {
    session.answers[existingAnswerIndex] = answerData;
  } else {
    session.answers.push(answerData);
  }

  // UPDATE TIME REMAINING
  const startTime = new Date(session.startTime);
  const now = new Date();
  const elapsedMinutes = Math.floor((now - startTime) / 1000 / 60);
  const totalTime = session.exam.settings?.timeLimit || session.exam.timeLimit || 60;
  session.timeRemaining = Math.max(0, totalTime - elapsedMinutes);

  await session.save();

  await createEvent(req.user._id, 'answer_question', {
    examId: session.exam,
    sessionId: session._id,
    questionId,
    data: { answer, timeTakenSeconds: timeSpent, flagged }
  });

  session.lastActivity = new Date();
  session.progress = {
    questionsAnswered: session.answers.length,
    totalQuestions: session.exam.questions?.length || 0,
    percentage: session.exam.questions?.length ? 
      Math.round((session.answers.length / session.exam.questions.length) * 100) : 0
  };

  try {
    await redis.setEx(`exam_session:${session._id}`, 3600, JSON.stringify(session));
  } catch (error) {
    // Redis unavailable
  }

  res.json({
    success: true,
    message: 'Answer submitted successfully',
    data: {
      timeRemaining: session.timeRemaining
    }
  });
});

// @desc    Submit exam
// @route   POST /api/exam-sessions/:id/submit
// @access  Private (Student)
export const submitExam = asyncHandler(async (req, res) => {
  const session = await ExamSession.findById(req.params.id).populate('exam');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found'
    });
  }

  if (session.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  if (session.status !== 'in-progress') {
    return res.status(400).json({
      success: false,
      message: 'Exam already submitted'
    });
  }

  // CALCULATE FINAL TIME REMAINING
  const startTime = new Date(session.startTime);
  const endTime = new Date();
  const elapsedMinutes = Math.floor((endTime - startTime) / 1000 / 60);
  const totalTime = session.exam.settings?.timeLimit || session.exam.timeLimit || 60;
  session.timeRemaining = Math.max(0, totalTime - elapsedMinutes);

  session.status = 'submitted';
  session.endTime = endTime;

  // Auto-grade if enabled
  if (session.exam.settings.autoGrading) {
    await gradeExam(session);
  }

  await session.save();

  await createEvent(req.user._id, 'submit_exam', {
    examId: session.exam._id,
    sessionId: session._id
  });

  try {
    await redis.del(`exam_session:${session._id}`);
  } catch (error) {
    // Redis unavailable
  }

  res.json({
    success: true,
    message: 'Exam submitted successfully',
    data: {
      session,
      examId: session.exam._id,
      score: session.score,
      isGraded: session.isGraded
    }
  });
});

// @desc    Auto-submit exam (time up)
// @route   POST /api/exam-sessions/:id/auto-submit
// @access  Private (Student)
export const autoSubmitExam = asyncHandler(async (req, res) => {
  const session = await ExamSession.findById(req.params.id).populate('exam');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found'
    });
  }

  if (session.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  // TIME EXPIRED - SET TO 0
  session.timeRemaining = 0;
  session.status = 'auto-submitted';
  session.endTime = new Date();

  // Auto-grade if enabled
  if (session.exam.settings.autoGrading) {
    await gradeExam(session);
  }

  await session.save();

  try {
    await redis.del(`exam_session:${session._id}`);
  } catch (error) {
    // Redis unavailable
  }

  res.json({
    success: true,
    message: 'Exam auto-submitted due to time limit',
    data: session
  });
});

// @desc    Get user's active sessions for exam
// @route   GET /api/exam-sessions/user/:examId
// @access  Private (Student)
export const getUserSessions = asyncHandler(async (req, res) => {
  const sessions = await ExamSession.find({
    exam: req.params.examId,
    student: req.user._id
  }).sort({ createdAt: -1 });

  res.json({ success: true, data: sessions });
});

// @desc    Bulk sync answers
// @route   POST /api/exam-sessions/:id/sync
// @access  Private (Student)
export const syncAnswers = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  const session = await ExamSession.findById(req.params.id).populate('exam');

  if (!session || session.student.toString() !== req.user._id.toString()) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  // Bulk update answers
  for (const answer of answers) {
    const existingIndex = session.answers.findIndex(
      a => a.questionId.toString() === answer.questionId
    );
    
    if (existingIndex >= 0) {
      session.answers[existingIndex] = answer;
    } else {
      session.answers.push(answer);
    }
  }

  // UPDATE TIME ON AUTO-SAVE
  const startTime = new Date(session.startTime);
  const now = new Date();
  const elapsedMinutes = Math.floor((now - startTime) / 1000 / 60);
  const totalTime = session.exam.settings?.timeLimit || session.exam.timeLimit || 60;
  session.timeRemaining = Math.max(0, totalTime - elapsedMinutes);

  session.lastActivity = new Date();
  await session.save();

  res.json({ 
    success: true, 
    message: 'Answers synced',
    data: {
      answersCount: session.answers.length,
      timeRemaining: session.timeRemaining
    }
  });
});

// @desc    Flag suspicious activity
// @route   POST /api/exam-sessions/:id/flag-activity
// @access  Private (Student)
export const flagSuspiciousActivity = asyncHandler(async (req, res) => {
  const { activityType, severity = 'medium' } = req.body;

  const session = await ExamSession.findById(req.params.id);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found'
    });
  }

  session.aiAnalysis.suspiciousActivity.push({
    type: activityType,
    timestamp: new Date(),
    severity
  });

  const riskIncrease = severity === 'high' ? 20 : severity === 'medium' ? 10 : 5;
  session.aiAnalysis.riskScore = Math.min(100, (session.aiAnalysis.riskScore || 0) + riskIncrease);

  await session.save();

  await createEvent(req.user._id, 'anti_cheating_flag', {
    examId: session.exam,
    sessionId: session._id,
    data: { activityType, severity }
  });

  res.json({
    success: true,
    message: 'Activity flagged'
  });
});

// ✅ FIXED GRADING - Case-insensitive + handles value/text mismatch
const gradeExam = async (session) => {
  const exam = session.exam;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let unanswered = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  // Iterate through ALL exam questions
  exam.questions.forEach((question, index) => {
    totalPoints += question.points || 1;

    // Find if student answered this question
    const studentAnswer = session.answers.find(
      a => a.questionId.toString() === question._id.toString()
    );

    if (!studentAnswer || !studentAnswer.answer || studentAnswer.answer.toString().trim() === '') {
      // Question not answered
      unanswered++;
      incorrectAnswers++;
      return;
    }

    // Question was answered - check if correct
    let isCorrect = false;

    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      // ✅ CASE-INSENSITIVE COMPARISON
      const studentAnswerLower = studentAnswer.answer.toString().toLowerCase().trim();
      
      // Check against correctAnswer field
      if (question.correctAnswer) {
        const correctAnswerLower = question.correctAnswer.toString().toLowerCase().trim();
        isCorrect = studentAnswerLower === correctAnswerLower;
        
        // ✅ If not correct, check if student selected by option text/value
        if (!isCorrect && question.options) {
          const correctOption = question.options.find(opt => {
            const optValue = (opt.value || '').toString().toLowerCase().trim();
            const optText = (opt.text || '').toString().toLowerCase().trim();
            return optValue === correctAnswerLower || optText === correctAnswerLower || opt.isCorrect === true;
          });
          
          if (correctOption) {
            const correctValueLower = (correctOption.value || '').toString().toLowerCase().trim();
            const correctTextLower = (correctOption.text || '').toString().toLowerCase().trim();
            // ✅ Accept either value OR text
            isCorrect = studentAnswerLower === correctValueLower || studentAnswerLower === correctTextLower;
          }
        }
      } else {
        // Check against isCorrect flag in options
        const correctOption = question.options.find(opt => opt.isCorrect === true);
        if (correctOption) {
          const correctValueLower = (correctOption.value || correctOption.text || '').toString().toLowerCase().trim();
          const correctTextLower = (correctOption.text || correctOption.value || '').toString().toLowerCase().trim();
          // ✅ Accept either value OR text
          isCorrect = studentAnswerLower === correctValueLower || studentAnswerLower === correctTextLower;
        }
      }

      if (isCorrect) {
        correctAnswers++;
        earnedPoints += question.points || 1;
        studentAnswer.isCorrect = true;
        studentAnswer.points = question.points || 1;
      } else {
        incorrectAnswers++;
        studentAnswer.isCorrect = false;
        studentAnswer.points = 0;
      }
    } else if (question.type === 'short-answer') {
      // Simple string comparison - case insensitive
      isCorrect = studentAnswer.answer.toLowerCase().trim() === 
                  (question.correctAnswer || question.answer || '').toLowerCase().trim();
      
      if (isCorrect) {
        correctAnswers++;
        earnedPoints += question.points || 1;
        studentAnswer.isCorrect = true;
        studentAnswer.points = question.points || 1;
      } else {
        incorrectAnswers++;
        studentAnswer.isCorrect = false;
        studentAnswer.points = 0;
      }
    }
    // Essay and code questions require manual grading
  });

  // Calculate score based on ALL questions
  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = percentage >= (exam.settings?.passingScore || exam.passingScore || 70);

  session.score = {
    totalPoints,
    earnedPoints,
    percentage,
    passed
  };

  session.isGraded = true;

  // Create result record
  await Result.create({
    examSession: session._id,
    exam: exam._id,
    student: session.student,
    score: {
      totalPoints,
      earnedPoints,
      percentage,
      passed
    },
    analytics: {
      timeSpent: Math.floor((session.endTime - session.startTime) / 1000),
      questionsAttempted: session.answers.length,
      questionsCorrect: correctAnswers,
      questionsIncorrect: incorrectAnswers,
      questionsUnanswered: unanswered
    }
  });
};
