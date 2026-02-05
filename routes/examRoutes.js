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
  enrollByAccessCode
} from '../controllers/examController.js';
import { protect, optionalAuth } from '../middleware/AuthMiddleware.js';

const router = express.Router();

router.get('/', protect, getExams);

router.get('/link/:examLink', optionalAuth, getExamByLink);

router.get('/:id', protect, getExam);

router.post('/', protect, createExam);

router.put('/:id', protect, updateExam);

router.delete('/:id', protect, deleteExam);

router.post('/:id/enroll', protect, enrollInExam);

router.post('/:id/start', protect, startExam);

router.post('/enroll-code', protect, enrollByAccessCode);

export default router;