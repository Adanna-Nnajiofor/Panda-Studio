import type { Request, Response } from 'express';
import BlogPost from '../models/BlogPost';
import type { AuthenticatedRequest } from '../types/auth';
import { isPrivilegedRole } from '../utils/user';

const getUser = (req: Request) => (req as AuthenticatedRequest).user;

export const getPublishedPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, tag, page = '1', limit = '12' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { isPublished: true };
    if (category) filter.category = category;
    if (tag) filter.tags = { $in: [tag] };

    const skip = (Number(page) - 1) * Number(limit);
    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .populate('author', 'fullName avatar position')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-content'),
      BlogPost.countDocuments(filter),
    ]);
    res.json({ success: true, count: posts.length, total, page: Number(page), posts });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
};

export const getPostBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, isPublished: true })
      .populate('author', 'fullName avatar position bio')
      .populate('projectId', 'progressStatus');
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }
    // Increment views
    post.views += 1;
    await post.save();
    res.json({ success: true, post });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
};

export const getAllPosts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const posts = await BlogPost.find()
      .populate('author', 'fullName avatar')
      .sort({ createdAt: -1 })
      .select('-content');
    res.json({ success: true, count: posts.length, posts });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const post = await BlogPost.create({ ...req.body, author: user?.id });
    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to create post' });
  }
};

export const updatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }
    const isAuthor = String(post.author) === user?.id;
    if (!isAuthor && !isPrivilegedRole(user?.role)) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    const updated = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, post: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to update post' });
  }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};
