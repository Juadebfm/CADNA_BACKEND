import asyncHandler from 'express-async-handler';
import Event from '../models/eventModel.js';

export const logEvent = asyncHandler(async (req, res) => {
  const { eventType, examId, sessionId, questionId, data } = req.body;
  
  const event = await Event.create({
    userId: req.user._id,
    examId,
    sessionId,
    questionId,
    eventType,
    data: {
      ...data,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json({ success: true, data: event });
});

export const getEvents = asyncHandler(async (req, res) => {
  const { examId, sessionId, eventType, limit = 100 } = req.query;
  
  const filter = {};
  if (examId) filter.examId = examId;
  if (sessionId) filter.sessionId = sessionId;
  if (eventType) filter.eventType = eventType;
  
  const events = await Event.find(filter)
    .populate('userId', 'firstName lastName email')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

  res.json({ success: true, data: events });
});

// Helper function to log events from other controllers
export const createEvent = async (userId, eventType, data = {}) => {
  try {
    return await Event.create({
      userId,
      eventType,
      ...data,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Event logging failed:', error);
  }
};