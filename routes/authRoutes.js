import express from 'express';
import {
  register, login, verify2faLogin,
  setup2fa, verify2faEnable, disable2fa,
  refresh, logout, me
} from '../controllers/authController.js';
import { extendExamToken } from '../controllers/examTokenController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();


router.post('/register', register);


router.post('/login', login);

router.post('/verify-2fa-login', verify2faLogin);


router.post('/setup-2fa', protect, setup2fa);


router.post('/verify-2fa-enable', protect, verify2faEnable);


router.post('/disable-2fa', protect, disable2fa);


router.post('/refresh', refresh);



router.post('/logout', logout);


router.get('/me', protect, me);


router.post('/extend-exam-token', protect, extendExamToken);

export default router;
