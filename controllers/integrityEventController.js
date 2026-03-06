import asyncHandler from 'express-async-handler';
import ExamSession from '../models/examSessionModel.js';

// @desc    Log integrity event
// @route   POST /api/exam-sessions/:id/integrity-event
// @access  Private
export const logIntegrityEvent = asyncHandler(async (req, res) => {
  const { eventType, timestamp, timeFromStart, severity, metadata } = req.body;

  console.log(' INTEGRITY EVENT RECEIVED:', {
    sessionId: req.params.id,
    eventType,
    severity,
    timestamp
  });

  // Find the exam session
  const session = await ExamSession.findById(req.params.id);

  if (!session) {
    console.error('Session not found:', req.params.id);
    return res.status(404).json({
      success: false,
      error: 'Exam session not found'
    });
  }

  // Initialize violation fields if they don't exist
  if (!session.violations) {
    session.violations = {
      tabSwitches: 0,
      windowBlurs: 0,
      fullscreenExits: 0,
      copyAttempts: 0,
      otherViolations: 0
    };
  }

  if (!session.integrityEvents) {
    session.integrityEvents = [];
  }

  if (session.totalViolations === undefined || session.totalViolations === null) {
    session.totalViolations = 0;
  }

  // Add the integrity event
  session.integrityEvents.push({
    eventType,
    timestamp: new Date(timestamp),
    timeFromStart,
    severity,
    metadata
  });

  // Increment the appropriate violation counter
  switch (eventType) {
    case 'tab_switch':
      session.violations.tabSwitches = (session.violations.tabSwitches || 0) + 1;
      console.log(' Tab switch detected. Total:', session.violations.tabSwitches);
      break;
    case 'window_blur':
      session.violations.windowBlurs = (session.violations.windowBlurs || 0) + 1;
      console.log('  window blur detected. Total:', session.violations.windowBlurs);
      break;
    case 'fullscreen_exit':
    case 'fullscreen_denied':
      session.violations.fullscreenExits = (session.violations.fullscreenExits || 0) + 1;
      console.log(' Fullscreen exit detected. Total:', session.violations.fullscreenExits);
      break;
    case 'copy_attempt':
    case 'paste_attempt':
    case 'cut_attempt':
      session.violations.copyAttempts = (session.violations.copyAttempts || 0) + 1;
      console.log(' Copy/paste attempt detected. Total:', session.violations.copyAttempts);
      break;
    default:
      session.violations.otherViolations = (session.violations.otherViolations || 0) + 1;
      console.log(' Other violation detected. Total:', session.violations.otherViolations);
  }

  // Update total violations count
  session.totalViolations = 
    (session.violations.tabSwitches || 0) +
    (session.violations.windowBlurs || 0) +
    (session.violations.fullscreenExits || 0) +
    (session.violations.copyAttempts || 0) +
    (session.violations.otherViolations || 0);

  console.log(' TOTAL VIOLATIONS:', session.totalViolations);

  // Auto-flag if violations >= 10
  if (session.totalViolations >= 10 && !session.flagged) {
    session.flagged = true;
    session.flagReason = `High violation count (${session.totalViolations} incidents)`;
    console.log(' SESSION FLAGGED: High violation count');
  }

  // Mark the fields as modified (important for nested objects)
  session.markModified('violations');
  session.markModified('integrityEvents');

  // Save the session
  await session.save();

  console.log(' VIOLATION SAVED TO DATABASE');

  res.json({
    success: true,
    data: {
      totalViolations: session.totalViolations,
      violations: session.violations,
      flagged: session.flagged,
      eventLogged: true
    }
  });
});

// @desc    Get integrity events for a session
// @route   GET /api/exam-sessions/:id/integrity-events
// @access  Private
export const getIntegrityEvents = asyncHandler(async (req, res) => {
  const session = await ExamSession.findById(req.params.id)
    .select('integrityEvents violations totalViolations flagged flagReason');

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Exam session not found'
    });
  }

  res.json({
    success: true,
    data: {
      integrityEvents: session.integrityEvents || [],
      violations: session.violations || {
        tabSwitches: 0,
        windowBlurs: 0,
        fullscreenExits: 0,
        copyAttempts: 0,
        otherViolations: 0
      },
      totalViolations: session.totalViolations || 0,
      flagged: session.flagged || false,
      flagReason: session.flagReason || null
    }
  });
});
