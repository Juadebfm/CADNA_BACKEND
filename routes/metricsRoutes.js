import express from 'express';
import {
  trackQuestionNavigation,
  logSecurityEvent,
  logEngagement,
  getExamTimeMetrics,
  getPassFailMetrics,
  getSecurityMetrics,
  getEngagementMetrics
} from '../controllers/metricsController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// Tracking endpoints
router.post('/track/question', protect, trackQuestionNavigation);
router.post('/track/security', protect, logSecurityEvent);
router.post('/track/engagement', protect, logEngagement);

// Metrics endpoints
router.get('/exam/:examId/time', protect, getExamTimeMetrics);
router.get('/exam/:examId/pass-fail', protect, getPassFailMetrics);
router.get('/exam/:examId/security', protect, getSecurityMetrics);
router.get('/exam/:examId/engagement', protect, getEngagementMetrics);

export default router;