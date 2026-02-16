import express from 'express';
import { seedExams, deleteSeedExams } from '../controllers/seedController.js';
import { protect } from '../middleware/AuthMiddleware.js';
import {  requireRole } from '../middleware/RoleMiddleware.js';

const router = express.Router();

// Seed exams (Admin/Instructor only)
router.post('/seed-exams', protect, requireRole('admin', 'instructor'), seedExams);

// Delete seed exams (Admin only)
router.delete('/seed-exams', protect, requireRole('admin'), deleteSeedExams);

export default router;
