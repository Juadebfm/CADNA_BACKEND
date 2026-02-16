import express from 'express';
import {
  startExam,           // ← ADD THIS IMPORT
  getExamSession,
  submitAnswer,
  submitExam,
  autoSubmitExam,
  flagSuspiciousActivity,
  getUserSessions,
  syncAnswers
} from '../controllers/examSessionController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// START EXAM - ADD THIS ROUTE!
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

export default router;
