import express from 'express';
import {
  getExamAnalytics,
  getInstructorDashboard,
  getAdminDashboard
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/analytics/exam/{examId}:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get exam analytics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       '200':
 *         description: Exam analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         totalAttempts:
 *                           type: number
 *                         completedAttempts:
 *                           type: number
 *                         averageScore:
 *                           type: number
 *                         passRate:
 *                           type: number
 *                         questionAnalysis:
 *                           type: array
 *                         performanceDistribution:
 *                           type: array
 *       '403':
 *         description: Not authorized
 *       '404':
 *         description: Exam not found
 */
router.get('/exam/:examId', protect, getExamAnalytics);

/**
 * @openapi
 * /api/analytics/instructor/dashboard:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get instructor dashboard analytics
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Instructor dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalExams:
 *                           type: number
 *                         totalSessions:
 *                           type: number
 *                         completedSessions:
 *                           type: number
 *                         averageScore:
 *                           type: number
 *                         passRate:
 *                           type: number
 *                     recentActivity:
 *                       type: array
 *                     trends:
 *                       type: object
 *       '403':
 *         description: Not authorized - Instructor access required
 */
router.get('/instructor/dashboard', protect, getInstructorDashboard);

/**
 * @openapi
 * /api/analytics/admin/dashboard:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get admin dashboard analytics
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Admin dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: number
 *                         totalExams:
 *                           type: number
 *                         totalSessions:
 *                           type: number
 *                         activeSessions:
 *                           type: number
 *                         recentUsers:
 *                           type: number
 *                     userDistribution:
 *                       type: array
 *                     performance:
 *                       type: object
 *                     security:
 *                       type: object
 *       '403':
 *         description: Not authorized - Admin access required
 */
router.get('/admin/dashboard', protect, getAdminDashboard);

export default router;