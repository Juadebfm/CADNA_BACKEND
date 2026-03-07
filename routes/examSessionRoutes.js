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


// START EXAM (no :id parameter)
router.post('/start', protect, startExam);



router.post('/api/exam-sessions/start', protect, startExam);

// USER SESSIONS (specific path before /:id)
router.get('/user/:examId', protect, getUserSessions);

//  INTEGRITY ROUTES  
router.post('/:id/integrity-event', protect, logIntegrityEvent);
router.get('/:id/integrity-events', protect, getIntegrityEvents);

// SUBMIT ANSWER
router.post('/:id/submit-answer', protect, submitAnswer);

// SYNC ANSWERS
router.post('/:id/sync', protect, syncAnswers);

// SUBMIT EXAM
router.post('/:id/submit', protect, submitExam);

// AUTO-SUBMIT EXAM
router.post('/:id/auto-submit', protect, autoSubmitExam);

// FLAG SUSPICIOUS ACTIVITY
router.post('/:id/flag-activity', protect, flagSuspiciousActivity);


router.get('/:id', protect, getExamSession);

export default router;