import express from 'express';
import {
  getPosts,
  getPost,
  getUserPosts,
} from '../controllers/post.controller.js';

const router = express.Router();

router.get('/', getPosts);
router.get('/:postId', getPost);
router.get('/user/:userName', getUserPosts);

export default router;
