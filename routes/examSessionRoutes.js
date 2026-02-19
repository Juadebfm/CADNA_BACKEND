import express from 'express';
import {
  startExam,           
  getExamSession,
  submitAnswer,
  submitExam,
  autoSubmitExam,
  flagSuspiciousActivity,
  getUserSessions,
  syncAnswers
} from '../controllers/examSessionController.js';
import {
  logIntegrityEvent,
  getIntegrityEvents
} from '../controllers/integrityEventController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// START EXAM
router.post('/start/:examId', protect, startExam);

// Get session
router.get('/:id', protect, getExamSession);
router.get('/user/:examId', protect, getUserSessions);

// Submit answers
router.post('/:id/answer', protect, submitAnswer);
router.post('/:id/sync', protect, syncAnswers);

// Submit exam
router.post('/:id/submit', protect, submitExam);

// Auto-submit exam
router.post('/:id/auto-submit', protect, autoSubmitExam);

// Flag suspicious activity
router.post('/:id/flag-activity', protect, flagSuspiciousActivity);

// Integrity event logging (NEW - Anti-cheating)
router.post('/:id/integrity-event', protect, logIntegrityEvent);
router.get('/:id/integrity-events', protect, getIntegrityEvents);

export default router;
