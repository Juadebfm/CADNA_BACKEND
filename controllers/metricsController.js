import asyncHandler from 'express-async-handler';
import Event from '../models/eventModel.js';
import QuestionTracking from '../models/questionTrackingModel.js';
import SecurityEvent from '../models/securityEventModel.js';
import AuthLog from '../models/authLogModel.js';
import UserEngagement from '../models/userEngagementModel.js';
import ExamSession from '../models/examSessionModel.js';
import Result from '../models/resultModel.js';

// Track question navigation
export const trackQuestionNavigation = asyncHandler(async (req, res) => {
  const { sessionId, questionId, action } = req.body; // action: 'enter' or 'exit'
  
  if (action === 'enter') {
    await QuestionTracking.findOneAndUpdate(
      { sessionId, questionId, userId: req.user._id, exitTime: null },
      { 
        enterTime: new Date(),
        $inc: { revisitCount: 1 }
      },
      { upsert: true }
    );
  } else if (action === 'exit') {
    const tracking = await QuestionTracking.findOne({ 
      sessionId, questionId, userId: req.user._id, exitTime: null 
    });
    if (tracking) {
      const timeSpent = (new Date() - tracking.enterTime) / 1000;
      tracking.exitTime = new Date();
      tracking.timeSpent = timeSpent;
      await tracking.save();
    }
  }
  
  res.json({ success: true });
});

// Log security events
export const logSecurityEvent = asyncHandler(async (req, res) => {
  const { eventType, sessionId, metadata } = req.body;
  
  await SecurityEvent.create({
    userId: req.user._id,
    sessionId,
    eventType,
    metadata: {
      ...metadata,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });
  
  res.json({ success: true });
});

// Log engagement events
export const logEngagement = asyncHandler(async (req, res) => {
  const { engagementType, examId, sessionId, resourceId, metadata } = req.body;
  
  await UserEngagement.create({
    userId: req.user._id,
    examId,
    sessionId,
    engagementType,
    resourceId,
    metadata
  });
  
  res.json({ success: true });
});

// Get exam time metrics
export const getExamTimeMetrics = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  const sessions = await ExamSession.find({ exam: examId, status: { $in: ['submitted', 'auto-submitted'] } });
  
  const timeMetrics = {
    averageExamTime: sessions.reduce((sum, s) => sum + ((s.endTime - s.startTime) / 1000), 0) / sessions.length,
    questionTimeBreakdown: await QuestionTracking.aggregate([
      { $match: { sessionId: { $in: sessions.map(s => s._id) } } },
      { $group: { _id: '$questionId', avgTime: { $avg: '$timeSpent' }, totalViews: { $sum: 1 } } }
    ]),
    flaggedQuestionTimes: await QuestionTracking.find({ 
      sessionId: { $in: sessions.map(s => s._id) },
      flaggedAt: { $exists: true }
    })
  };
  
  res.json({ success: true, data: timeMetrics });
});

// Get pass/fail metrics
export const getPassFailMetrics = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  const results = await Result.find({ exam: examId });
  const total = results.length;
  const passed = results.filter(r => r.score.passed).length;
  
  const metrics = {
    passRate: (passed / total) * 100,
    failRate: ((total - passed) / total) * 100,
    averageScore: results.reduce((sum, r) => sum + r.score.percentage, 0) / total,
    scoreDistribution: [
      { range: '0-20', count: results.filter(r => r.score.percentage <= 20).length },
      { range: '21-40', count: results.filter(r => r.score.percentage > 20 && r.score.percentage <= 40).length },
      { range: '41-60', count: results.filter(r => r.score.percentage > 40 && r.score.percentage <= 60).length },
      { range: '61-80', count: results.filter(r => r.score.percentage > 60 && r.score.percentage <= 80).length },
      { range: '81-100', count: results.filter(r => r.score.percentage > 80).length }
    ]
  };
  
  res.json({ success: true, data: metrics });
});

// Get security metrics
export const getSecurityMetrics = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  const sessions = await ExamSession.find({ exam: examId });
  const sessionIds = sessions.map(s => s._id);
  
  const securityEvents = await SecurityEvent.find({ sessionId: { $in: sessionIds } });
  
  const metrics = {
    totalSecurityEvents: securityEvents.length,
    eventsByType: securityEvents.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {}),
    highRiskSessions: securityEvents.filter(e => e.severity === 'high').length,
    suspiciousUsers: [...new Set(securityEvents.filter(e => e.severity === 'high').map(e => e.userId))]
  };
  
  res.json({ success: true, data: metrics });
});

// Get engagement metrics
export const getEngagementMetrics = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  const engagements = await UserEngagement.find({ examId });
  const authLogs = await AuthLog.find({});
  
  const metrics = {
    totalEngagements: engagements.length,
    engagementsByType: engagements.reduce((acc, eng) => {
      acc[eng.engagementType] = (acc[eng.engagementType] || 0) + 1;
      return acc;
    }, {}),
    averageSessionDuration: authLogs
      .filter(log => log.sessionDuration)
      .reduce((sum, log) => sum + log.sessionDuration, 0) / authLogs.filter(log => log.sessionDuration).length,
    dropOffRate: await calculateDropOffRate(examId)
  };
  
  res.json({ success: true, data: metrics });
});

// Helper function to calculate drop-off rate
const calculateDropOffRate = async (examId) => {
  const startedSessions = await ExamSession.countDocuments({ exam: examId });
  const completedSessions = await ExamSession.countDocuments({ 
    exam: examId, 
    status: { $in: ['submitted', 'auto-submitted'] }
  });
  
  return ((startedSessions - completedSessions) / startedSessions) * 100;
};