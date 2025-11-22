import express from 'express';
import { logEvent, getEvents } from '../controllers/eventController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

router.post('/log', protect, logEvent);
router.get('/', protect, getEvents);

export default router;