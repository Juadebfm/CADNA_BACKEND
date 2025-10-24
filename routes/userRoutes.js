import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getUserResults,
  getUserSessions,
  getAllUsers,
  deleteUser
} from '../controllers/userController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users (Admin only)
 *     security:
 *       - BearerAuth: []
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, instructor, admin]
 *         description: Filter by role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, email, university
 *     responses:
 *       '200':
 *         description: List of users
 *       '403':
 *         description: Not authorized - Admin access required
 */
router.get('/', protect, getAllUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user profile
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       '200':
 *         description: User profile
 *       '403':
 *         description: Not authorized
 *       '404':
 *         description: User not found
 */
router.get('/:id', protect, getUserProfile);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user profile
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               university:
 *                 type: string
 *               studentId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [student, instructor, admin]
 *                 description: Only admin can update role
 *     responses:
 *       '200':
 *         description: Profile updated successfully
 *       '403':
 *         description: Not authorized
 *       '404':
 *         description: User not found
 */
router.put('/:id', protect, updateUserProfile);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       '200':
 *         description: User deleted successfully
 *       '403':
 *         description: Not authorized - Admin access required
 *       '404':
 *         description: User not found
 */
router.delete('/:id', protect, deleteUser);

/**
 * @openapi
 * /api/users/{id}/results:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user exam results
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *     responses:
 *       '200':
 *         description: User exam results with statistics
 *       '403':
 *         description: Not authorized
 */
router.get('/:id/results', protect, getUserResults);

/**
 * @openapi
 * /api/users/{id}/sessions:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user exam sessions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in-progress, submitted, auto-submitted, cancelled]
 *         description: Filter by session status
 *     responses:
 *       '200':
 *         description: User exam sessions
 *       '403':
 *         description: Not authorized
 */
router.get('/:id/sessions', protect, getUserSessions);

export default router;