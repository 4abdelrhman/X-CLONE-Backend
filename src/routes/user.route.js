import express from 'express';
import {
  getUserProfile,
  updateProfile,
  syncUser,
  getCurrentUser,
  followUser,
  signUp,
  logIn,
} from '../controllers/user.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', logIn);

router.get('/profile/:username', getUserProfile);

router.post('/sync', protectRoute, syncUser);
router.post('/me', protectRoute, getCurrentUser);
router.post('/follow/:targetUserId', protectRoute, followUser);
router.put('/profile', protectRoute, updateProfile);

export default router;
