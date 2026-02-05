import express from 'express';
import {
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


router.get('/:id', protect, getExamSession);
router.get('/user/:examId', protect, getUserSessions);


router.post('/:id/answer', protect, submitAnswer);
router.post('/:id/sync', protect, syncAnswers);


router.post('/:id/submit', protect, submitExam);


router.post('/:id/auto-submit', protect, autoSubmitExam);


router.post('/:id/flag-activity', protect, flagSuspiciousActivity);

export default router;