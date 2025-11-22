import asyncHandler from 'express-async-handler';
import Analytics from '../models/analyticsModel.js';
import ExamSession from '../models/examSessionModel.js';
import Result from '../models/resultModel.js';
import Exam from '../models/examModel.js';
import User from '../models/userModel.js';
import Event from '../models/eventModel.js';

// @desc    Get exam analytics
// @route   GET /api/analytics/exam/:examId
// @access  Private (Instructor/Admin)
export const getExamAnalytics = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  // Check authorization
  if (exam.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view these analytics'
    });
  }

  let analytics = await Analytics.findOne({ exam: req.params.examId });

  if (!analytics) {
    // Generate analytics if not exists
    analytics = await generateExamAnalytics(req.params.examId);
  }

  res.json({
    success: true,
    data: analytics
  });
});

// @desc    Get instructor dashboard analytics
// @route   GET /api/analytics/instructor/dashboard
// @access  Private (Instructor/Admin)
export const getInstructorDashboard = asyncHandler(async (req, res) => {
  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized - Instructor access required'
    });
  }

  const instructorId = req.user._id;

  // Get instructor's exams
  const exams = await Exam.find({ instructor: instructorId }).select('_id title');
  const examIds = exams.map(exam => exam._id);

  // Get overall statistics
  const totalSessions = await ExamSession.countDocuments({ exam: { $in: examIds } });
  const completedSessions = await ExamSession.countDocuments({ 
    exam: { $in: examIds }, 
    status: { $in: ['submitted', 'auto-submitted'] }
  });

  const avgScoreResult = await Result.aggregate([
    { $match: { exam: { $in: examIds } } },
    { $group: { _id: null, avgScore: { $avg: '$score.percentage' } } }
  ]);

  const passRateResult = await Result.aggregate([
    { $match: { exam: { $in: examIds } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        passed: { $sum: { $cond: ['$score.passed', 1, 0] } }
      }
    }
  ]);

  // Recent activity
  const recentSessions = await ExamSession.find({ exam: { $in: examIds } })
    .populate('exam', 'title')
    .populate('student', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10);

  // Performance trends (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyStats = await ExamSession.aggregate([
    {
      $match: {
        exam: { $in: examIds },
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        sessions: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $in: ['$status', ['submitted', 'auto-submitted']] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const dashboard = {
    overview: {
      totalExams: exams.length,
      totalSessions,
      completedSessions,
      averageScore: avgScoreResult[0]?.avgScore || 0,
      passRate: passRateResult[0] ? (passRateResult[0].passed / passRateResult[0].total) * 100 : 0
    },
    recentActivity: recentSessions,
    trends: {
      daily: dailyStats
    }
  };

  res.json({
    success: true,
    data: dashboard
  });
});

// @desc    Get admin dashboard analytics
// @route   GET /api/analytics/admin/dashboard
// @access  Private (Admin)
export const getAdminDashboard = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized - Admin access required'
    });
  }

  // System-wide statistics
  const totalUsers = await User.countDocuments();
  const totalExams = await Exam.countDocuments();
  const totalSessions = await ExamSession.countDocuments();
  const activeSessions = await ExamSession.countDocuments({ status: 'in-progress' });

  // User distribution
  const userDistribution = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);

  // Recent registrations (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

  // System performance metrics
  const avgSessionTime = await ExamSession.aggregate([
    {
      $match: {
        status: { $in: ['submitted', 'auto-submitted'] },
        endTime: { $exists: true }
      }
    },
    {
      $project: {
        duration: { $subtract: ['$endTime', '$startTime'] }
      }
    },
    {
      $group: {
        _id: null,
        avgDuration: { $avg: '$duration' }
      }
    }
  ]);

  // Suspicious activity summary
  const suspiciousActivity = await ExamSession.aggregate([
    { $unwind: '$aiAnalysis.suspiciousActivity' },
    {
      $group: {
        _id: '$aiAnalysis.suspiciousActivity.severity',
        count: { $sum: 1 }
      }
    }
  ]);

  const dashboard = {
    overview: {
      totalUsers,
      totalExams,
      totalSessions,
      activeSessions,
      recentUsers
    },
    userDistribution,
    performance: {
      averageSessionTime: avgSessionTime[0]?.avgDuration || 0
    },
    security: {
      suspiciousActivity
    }
  };

  res.json({
    success: true,
    data: dashboard
  });
});

// @desc    Generate or update exam analytics
// @route   POST /api/analytics/exam/:examId/generate
// @access  Private (Instructor/Admin)
export const generateExamAnalytics = asyncHandler(async (examId) => {
  const exam = await Exam.findById(examId);
  if (!exam) return null;

  // Get all sessions for this exam
  const sessions = await ExamSession.find({ exam: examId });
  const completedSessions = sessions.filter(s => ['submitted', 'auto-submitted'].includes(s.status));

  // Get all results for this exam
  const results = await Result.find({ exam: examId });

  // Calculate metrics
  const totalAttempts = sessions.length;
  const completedAttempts = completedSessions.length;
  const averageScore = results.length > 0 ? 
    results.reduce((sum, r) => sum + r.score.percentage, 0) / results.length : 0;
  const passRate = results.length > 0 ? 
    (results.filter(r => r.score.passed).length / results.length) * 100 : 0;

  // Enhanced question analysis using events
  const questionAnalysis = [];
  for (const question of exam.questions) {
    const questionAnswers = completedSessions.flatMap(s => 
      s.answers.filter(a => a.questionId.toString() === question._id.toString())
    );
    
    const correctAnswers = questionAnswers.filter(a => a.isCorrect).length;
    const totalAnswers = questionAnswers.length;
    
    // Get events for this question
    const questionEvents = await Event.find({
      examId,
      questionId: question._id,
      eventType: { $in: ['view_question', 'answer_question', 'flag_question'] }
    });
    
    const flagCount = questionEvents.filter(e => e.eventType === 'flag_question').length;
    const avgTimeFromEvents = questionEvents
      .filter(e => e.data?.timeTakenSeconds)
      .reduce((sum, e, _, arr) => sum + e.data.timeTakenSeconds / arr.length, 0);
    
    questionAnalysis.push({
      questionId: question._id,
      correctAnswers,
      totalAnswers,
      successRate: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
      averageTimeSpent: avgTimeFromEvents || (questionAnswers.length > 0 ? 
        questionAnswers.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / questionAnswers.length : 0),
      difficulty: question.difficulty,
      flagCount,
      cheatingRisk: flagCount > 0 ? Math.min(flagCount * 0.1, 1) : 0
    });
  }

  // Performance distribution
  const performanceDistribution = [
    { range: '0-20', count: 0, percentage: 0 },
    { range: '21-40', count: 0, percentage: 0 },
    { range: '41-60', count: 0, percentage: 0 },
    { range: '61-80', count: 0, percentage: 0 },
    { range: '81-100', count: 0, percentage: 0 }
  ];

  results.forEach(result => {
    const score = result.score.percentage;
    if (score <= 20) performanceDistribution[0].count++;
    else if (score <= 40) performanceDistribution[1].count++;
    else if (score <= 60) performanceDistribution[2].count++;
    else if (score <= 80) performanceDistribution[3].count++;
    else performanceDistribution[4].count++;
  });

  performanceDistribution.forEach(dist => {
    dist.percentage = results.length > 0 ? (dist.count / results.length) * 100 : 0;
  });

  // Time analysis
  const sessionTimes = completedSessions
    .filter(s => s.endTime)
    .map(s => (s.endTime - s.startTime) / 1000 / 60); // minutes

  const timeAnalysis = {
    fastest: sessionTimes.length > 0 ? Math.min(...sessionTimes) : 0,
    slowest: sessionTimes.length > 0 ? Math.max(...sessionTimes) : 0,
    median: sessionTimes.length > 0 ? 
      sessionTimes.sort((a, b) => a - b)[Math.floor(sessionTimes.length / 2)] : 0
  };

  // Update or create analytics
  const analyticsData = {
    exam: examId,
    instructor: exam.instructor,
    metrics: {
      totalAttempts,
      completedAttempts,
      averageScore,
      passRate,
      averageTimeSpent: sessionTimes.length > 0 ? 
        sessionTimes.reduce((sum, time) => sum + time, 0) / sessionTimes.length : 0,
      questionAnalysis,
      performanceDistribution,
      timeAnalysis
    },
    lastUpdated: new Date()
  };

  const analytics = await Analytics.findOneAndUpdate(
    { exam: examId },
    analyticsData,
    { upsert: true, new: true }
  );

  return analytics;
});