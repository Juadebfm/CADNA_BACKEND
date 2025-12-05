import asyncHandler from 'express-async-handler';
import ExamSession from '../models/examSessionModel.js';
import Exam from '../models/examModel.js';
import Result from '../models/resultModel.js';
import redis from '../db/redis.js';
import { createEvent } from './eventController.js';

// @desc    Get exam session
// @route   GET /api/exam-sessions/:id
// @access  Private
export const getExamSession = asyncHandler(async (req, res) => {
  // Try Redis first (if available)
  try {
    const cached = await redis.get(`exam_session:${req.params.id}`);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached)
      });
    }
  } catch (error) {
    // Redis unavailable, continue with database
  }

  const session = await ExamSession.findById(req.params.id)
    .populate('exam', 'title settings')
    .populate('student', 'firstName lastName email');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found'
    });
  }

  // Check ownership
  if (session.student._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this session'
    });
  }

  // Log view event
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
// @route   POST /api/exam-sessions/:id/answer
// @access  Private (Student)
export const submitAnswer = asyncHandler(async (req, res) => {
  const { questionId, answer, timeSpent, flagged } = req.body;

  const session = await ExamSession.findById(req.params.id);

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

  // Find existing answer or create new one
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

  await session.save();

  // Log answer event
  await createEvent(req.user._id, 'answer_question', {
    examId: session.exam,
    sessionId: session._id,
    questionId,
    data: { answer, timeTakenSeconds: timeSpent, flagged }
  });

  // Auto-save progress every answer
  session.lastActivity = new Date();
  session.progress = {
    questionsAnswered: session.answers.length,
    totalQuestions: session.exam.questions?.length || 0,
    percentage: session.exam.questions?.length ? 
      Math.round((session.answers.length / session.exam.questions.length) * 100) : 0
  };

  // Update Redis cache (if available)
  try {
    await redis.setEx(`exam_session:${session._id}`, 3600, JSON.stringify(session));
  } catch (error) {
    // Redis unavailable, continue without caching
  }

  res.json({
    success: true,
    message: 'Answer submitted successfully'
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

  // Update session status
  session.status = 'submitted';
  session.endTime = new Date();

  // Auto-grade if enabled
  if (session.exam.settings.autoGrading) {
    await gradeExam(session);
  }

  await session.save();

  // Log submit event
  await createEvent(req.user._id, 'submit_exam', {
    examId: session.exam._id,
    sessionId: session._id
  });

  // Clear Redis cache (if available)
  try {
    await redis.del(`exam_session:${session._id}`);
  } catch (error) {
    // Redis unavailable, continue without cache clearing
  }

  res.json({
    success: true,
    message: 'Exam submitted successfully',
    data: session
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

  session.status = 'auto-submitted';
  session.endTime = new Date();

  // Auto-grade if enabled
  if (session.exam.settings.autoGrading) {
    await gradeExam(session);
  }

  await session.save();

  // Clear Redis cache (if available)
  try {
    await redis.del(`exam_session:${session._id}`);
  } catch (error) {
    // Redis unavailable, continue without cache clearing
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
  const session = await ExamSession.findById(req.params.id);

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

  session.lastActivity = new Date();
  await session.save();

  res.json({ success: true, message: 'Answers synced' });
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

  // Update risk score based on activity
  const riskIncrease = severity === 'high' ? 20 : severity === 'medium' ? 10 : 5;
  session.aiAnalysis.riskScore = Math.min(100, (session.aiAnalysis.riskScore || 0) + riskIncrease);

  await session.save();

  // Log anti-cheating event
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

// Helper function to grade exam
const gradeExam = async (session) => {
  const exam = session.exam;
  let totalPoints = 0;
  let earnedPoints = 0;

  // Grade each answer
  for (const answer of session.answers) {
    const question = exam.questions.id(answer.questionId);
    if (!question) continue;

    totalPoints += question.points;

    // Auto-grade based on question type
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const correctOption = question.options.find(opt => opt.isCorrect);
      if (correctOption && answer.answer === correctOption.text) {
        answer.isCorrect = true;
        answer.points = question.points;
        earnedPoints += question.points;
      } else {
        answer.isCorrect = false;
        answer.points = 0;
      }
    } else if (question.type === 'short-answer') {
      // Simple string comparison (can be enhanced with AI)
      if (answer.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
        answer.isCorrect = true;
        answer.points = question.points;
        earnedPoints += question.points;
      } else {
        answer.isCorrect = false;
        answer.points = 0;
      }
    }
    // Essay and code questions require manual grading
  }

  // Calculate score
  const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  const passed = percentage >= exam.settings.passingScore;

  session.score = {
    total: totalPoints,
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
      questionsCorrect: session.answers.filter(a => a.isCorrect).length
    }
  });
};