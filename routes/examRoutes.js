import express from 'express';
import {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  enrollInExam,
  startExam,
  getExamByLink,
  getExamWithAnswers,
  enrollByAccessCode
} from '../controllers/examController.js';
import { protect, optionalAuth } from '../middleware/AuthMiddleware.js';

const router = express.Router();


router.get('/', protect, getExams);

router.get('/link/:examLink', optionalAuth, getExamByLink);

router.post('/enroll-code', protect, enrollByAccessCode);


router.get('/:id', protect, getExam);
router.get('/:id/with-answers', protect, getExamWithAnswers);
router.post('/:id/enroll', protect, enrollInExam);
router.post('/:id/start', protect, startExam);

router.post('/', protect, createExam);
router.put('/:id', protect, updateExam);
router.delete('/:id', protect, deleteExam);

export default router;
