import express from 'express';
import {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  enrollInExam,
  startExam
} from '../controllers/examController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/exams:
 *   get:
 *     tags:
 *       - Exams
 *     summary: Get all exams
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       '200':
 *         description: List of exams
 */
router.get('/', getExams);

/**
 * @openapi
 * /api/exams/{id}:
 *   get:
 *     tags:
 *       - Exams
 *     summary: Get single exam
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       '200':
 *         description: Exam details
 *       '404':
 *         description: Exam not found
 */
router.get('/:id', getExam);

/**
 * @openapi
 * /api/exams:
 *   post:
 *     tags:
 *       - Exams
 *     summary: Create new exam
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, questions, settings]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *               settings:
 *                 type: object
 *                 properties:
 *                   timeLimit:
 *                     type: number
 *                   passingScore:
 *                     type: number
 *     responses:
 *       '201':
 *         description: Exam created successfully
 *       '401':
 *         description: Not authenticated
 */
router.post('/', protect, createExam);

/**
 * @openapi
 * /api/exams/{id}:
 *   put:
 *     tags:
 *       - Exams
 *     summary: Update exam
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Exam updated successfully
 *       '403':
 *         description: Not authorized
 *       '404':
 *         description: Exam not found
 */
router.put('/:id', protect, updateExam);

/**
 * @openapi
 * /api/exams/{id}:
 *   delete:
 *     tags:
 *       - Exams
 *     summary: Delete exam
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       '200':
 *         description: Exam deleted successfully
 *       '403':
 *         description: Not authorized
 *       '404':
 *         description: Exam not found
 */
router.delete('/:id', protect, deleteExam);

/**
 * @openapi
 * /api/exams/{id}/enroll:
 *   post:
 *     tags:
 *       - Exams
 *     summary: Enroll in exam
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       '200':
 *         description: Successfully enrolled
 *       '400':
 *         description: Already enrolled
 *       '404':
 *         description: Exam not found
 */
router.post('/:id/enroll', protect, enrollInExam);

/**
 * @openapi
 * /api/exams/{id}/start:
 *   post:
 *     tags:
 *       - Exams
 *     summary: Start exam session
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timezone:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Exam session started
 *       '400':
 *         description: Exam not available or already started
 *       '403':
 *         description: Not enrolled
 */
router.post('/:id/start', protect, startExam);

export default router;