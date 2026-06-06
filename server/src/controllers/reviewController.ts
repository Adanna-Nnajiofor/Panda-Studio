import { z } from 'zod';
import Review from '../models/Review';
import type { AuthRequest } from '../types/auth';

type Response = any;

const reviewSchema = z.object({
  targetUserId: z.string().optional(),
  serviceId: z.string().optional(),
  equipmentId: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid review', errors: parsed.error.flatten().fieldErrors });
    }

    const review = await Review.create({
      author: req.user!.id,
      targetUser: parsed.data.targetUserId,
      service: parsed.data.serviceId,
      equipment: parsed.data.equipmentId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    return res.status(201).json({ review });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getCrewReviews = async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await Review.find({ targetUser: req.params.crewId })
      .populate('author', 'fullName')
      .sort({ createdAt: -1 });
    const avg =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
    return res.status(200).json({ reviews, averageRating: avg, count: reviews.length });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
