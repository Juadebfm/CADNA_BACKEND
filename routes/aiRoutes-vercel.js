import express from 'express';
import {
  gradeEssay,
  gradeEssaysBatch,
  detectAI,
  detectPlagiarism,
  analyzeExamBehavior,
  generateQuestions,
  generateSimilar,
  improveQuestion,
  getAIStatus,
  getUsageStats,
  getDailyCosts,
  checkCostLimit,
  testAIService,
  switchProvider
} from '../controllers/aiController-vercel.js';
import { protect, authorize } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ============================================
// GRADING ENDPOINTS (Instructor/Admin)
// ============================================
router.post('/grade-essay', authorize('instructor', 'admin'), gradeEssay);
router.post('/grade-essays-batch', authorize('instructor', 'admin'), gradeEssaysBatch);

// ============================================
// CHEATING DETECTION (Instructor/Admin)
// ============================================
router.post('/detect-ai', authorize('instructor', 'admin'), detectAI);
router.post('/detect-plagiarism', authorize('instructor', 'admin'), detectPlagiarism);
router.post('/analyze-behavior/:sessionId', authorize('instructor', 'admin'), analyzeExamBehavior);

// ============================================
// QUESTION GENERATION (Instructor/Admin)
// ============================================
router.post('/generate-questions', authorize('instructor', 'admin'), generateQuestions);
router.post('/generate-similar', authorize('instructor', 'admin'), generateSimilar);
router.post('/improve-question', authorize('instructor', 'admin'), improveQuestion);

// ============================================
// ADMIN ENDPOINTS
// ============================================
router.get('/status', authorize('admin'), getAIStatus);
router.get('/usage-stats', authorize('admin'), getUsageStats);
router.get('/daily-costs', authorize('admin'), getDailyCosts);
router.get('/cost-limit', authorize('admin'), checkCostLimit);
router.post('/test', authorize('admin'), testAIService);
router.post('/switch-provider', authorize('admin'), switchProvider);

export default router;
