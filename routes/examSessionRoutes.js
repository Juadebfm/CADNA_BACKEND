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

/**
 * @openapi
 * /api/exam-sessions/{id}:
 *   get:
 *     tags:
 *       - Exam Sessions
 *     summary: Get exam session details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam session ID
 *     responses:
 *       '200':
 *         description: Exam session details
 *       '403':
 *         description: Not authorized
 *       '404':
 *         description: Session not found
 */
router.get('/:id', protect, getExamSession);
router.get('/user/:examId', protect, getUserSessions);

/**
 * @openapi
 * /api/exam-sessions/{id}/answer:
 *   post:
 *     tags:
 *       - Exam Sessions
 *     summary: Submit answer for a question
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionId, answer]
 *             properties:
 *               questionId:
 *                 type: string
 *               answer:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                   - type: object
 *               timeSpent:
 *                 type: number
 *                 description: Time spent on question in seconds
 *               flagged:
 *                 type: boolean
 *                 description: Whether question is flagged for review
 *     responses:
 *       '200':
 *         description: Answer submitted successfully
 *       '400':
 *         description: Session not active
 *       '403':
 *         description: Not authorized
 */
router.post('/:id/answer', protect, submitAnswer);
router.post('/:id/sync', protect, syncAnswers);

/**
 * @openapi
 * /api/exam-sessions/{id}/submit:
 *   post:
 *     tags:
 *       - Exam Sessions
 *     summary: Submit exam (manual submission)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam session ID
 *     responses:
 *       '200':
 *         description: Exam submitted successfully
 *       '400':
 *         description: Exam already submitted
 *       '403':
 *         description: Not authorized
 */
router.post('/:id/submit', protect, submitExam);

/**
 * @openapi
 * /api/exam-sessions/{id}/auto-submit:
 *   post:
 *     tags:
 *       - Exam Sessions
 *     summary: Auto-submit exam (time up)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam session ID
 *     responses:
 *       '200':
 *         description: Exam auto-submitted successfully
 *       '403':
 *         description: Not authorized
 */
router.post('/:id/auto-submit', protect, autoSubmitExam);

/**
 * @openapi
 * /api/exam-sessions/{id}/flag-activity:
 *   post:
 *     tags:
 *       - Exam Sessions
 *     summary: Flag suspicious activity during exam
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activityType]
 *             properties:
 *               activityType:
 *                 type: string
 *                 enum: [tab-switch, window-blur, copy-paste, right-click, fullscreen-exit]
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *     responses:
 *       '200':
 *         description: Activity flagged successfully
 *       '404':
 *         description: Session not found
 */
router.post('/:id/flag-activity', protect, flagSuspiciousActivity);

export default router;