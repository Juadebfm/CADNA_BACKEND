import asyncHandler from 'express-async-handler';
import ExamSession from '../models/examSessionModel.js';

// @desc    Log integrity event (tab switch, fullscreen exit, etc.)
// @route   POST /api/exam-sessions/:sessionId/integrity-event
// @access  Private (Student)
export const logIntegrityEvent = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { eventType, metadata, timestamp, timeFromStart } = req.body;

  const session = await ExamSession.findById(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found'
    });
  }

  // Verify student owns this session
  if (session.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this session'
    });
  }

  // Create integrity event
  const integrityEvent = {
    eventType,
    timestamp: timestamp || new Date(),
    timeFromStart: timeFromStart || 0,
    metadata: metadata || {},
    severity: metadata?.severity || 'medium',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  };

  // Add to session's integrity events array
  if (!session.integrityEvents) {
    session.integrityEvents = [];
  }

  session.integrityEvents.push(integrityEvent);

  // Update violation counters
  if (!session.violations) {
    session.violations = {
      tabSwitches: 0,
      windowBlurs: 0,
      fullscreenExits: 0,
      copyAttempts: 0,
      otherViolations: 0
    };
  }

  // Increment appropriate counter
  switch (eventType) {
    case 'tab_switch':
      session.violations.tabSwitches += 1;
      break;
    case 'window_blur':
      session.violations.windowBlurs += 1;
      break;
    case 'fullscreen_exit':
      session.violations.fullscreenExits += 1;
      break;
    case 'copy_attempt':
    case 'paste_attempt':
      session.violations.copyAttempts += 1;
      break;
    default:
      session.violations.otherViolations += 1;
  }

  // Calculate total violations
  session.totalViolations = Object.values(session.violations).reduce((a, b) => a + b, 0);

  // Flag session if too many violations
  if (session.totalViolations >= 10) {
    session.flagged = true;
    session.flagReason = `High violation count: ${session.totalViolations} violations detected`;
  }

  await session.save();

  console.log(` Integrity event logged: ${eventType} for session ${sessionId}`);

  res.json({
    success: true,
    message: 'Integrity event logged',
    data: {
      totalViolations: session.totalViolations,
      flagged: session.flagged
    }
  });
});

// @desc    Get integrity events for a session
// @route   GET /api/exam-sessions/:sessionId/integrity-events
// @access  Private (Student/Instructor)
export const getIntegrityEvents = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await ExamSession.findById(sessionId)
    .select('integrityEvents violations totalViolations flagged');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found'
    });
  }

  // Students can only see their own sessions
  if (req.user.role === 'student' && session.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  res.json({
    success: true,
    data: {
      integrityEvents: session.integrityEvents || [],
      violations: session.violations || {},
      totalViolations: session.totalViolations || 0,
      flagged: session.flagged || false
    }
  });
});
