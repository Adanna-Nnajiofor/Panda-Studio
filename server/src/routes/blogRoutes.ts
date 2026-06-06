import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getPublishedPosts,
  getPostBySlug,
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/blogController';

const router = express.Router();

// Public
router.get('/', getPublishedPosts);
router.get('/:slug', getPostBySlug);

// Admin / privileged
router.get('/admin/all', protect('admin', 'super_admin'), getAllPosts);
router.post('/', protect('admin', 'super_admin', 'crew', 'staff'), createPost);
router.put('/:id', protect('admin', 'super_admin', 'crew', 'staff'), updatePost);
router.delete('/:id', protect('admin', 'super_admin'), deletePost);

export default router;
