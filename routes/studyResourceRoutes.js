import express from 'express';
import {
  getStudySuggestions,
  getStudyResources,
  getStudyResource,
  generateStudyResource,
  autoGenerateResources,
  deleteStudyResource
} from '../controllers/studyResourceController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/suggestions', getStudySuggestions);
router.get('/', getStudyResources);
router.get('/:id', getStudyResource);
router.post('/generate', generateStudyResource);
router.post('/auto-generate', autoGenerateResources);
router.delete('/:id', deleteStudyResource);

export default router;