import express from 'express';
import {
  getPosts,
  getPost,
  getUserPosts,
  createPost,
  likePost,
  deletePost,
} from '../controllers/post.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

//Public Routes
router.get('/', getPosts);
router.get('/:postId', getPost);
router.get('/user/:userName', getUserPosts);

//Protected Routes
router.post('/', protectRoute, upload.single('image'), createPost);
router.post('/:postId/like', protectRoute, likePost);
router.delete('/:postId/delete', protectRoute, deletePost);

export default router;
