import express from 'express';
import {
  getExamAnalytics,
  getInstructorDashboard,
  getAdminDashboard
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();



router.get('/exam/:examId', protect, getExamAnalytics);


router.get('/instructor/dashboard', protect, getInstructorDashboard);


router.get('/admin/dashboard', protect, getAdminDashboard);

export default router;