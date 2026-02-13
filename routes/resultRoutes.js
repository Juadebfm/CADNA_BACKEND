import express from 'express';
import { getExamResult, getDetailedResult } from '../controllers/resultController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

router.get('/:examId', protect, getExamResult);
router.get('/:examId/detailed', protect, getDetailedResult);


export default router;