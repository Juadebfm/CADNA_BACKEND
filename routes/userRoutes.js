import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
  changePassword,
  getUserResults,
  getUserSessions,
  getAllUsers,
  deleteUser,
} from '../controllers/userController.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/',                        protect, getAllUsers);
router.get('/:id',                     protect, getUserProfile);
router.put('/:id',                     protect, updateUserProfile);
router.put('/:id/password',            protect, changePassword);
router.post('/:id/avatar',             protect, uploadAvatar.single('avatar'), uploadUserAvatar);
router.delete('/:id',                  protect, deleteUser);
router.get('/:id/results',             protect, getUserResults);
router.get('/:id/sessions',            protect, getUserSessions);

export default router;