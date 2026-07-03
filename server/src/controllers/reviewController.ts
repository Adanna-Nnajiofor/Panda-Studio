import { z } from "zod";
import Review from "../models/Review";
import type { AuthRequest } from "../types/auth";

type Response = any;

const reviewSchema = z.object({
  targetUserId: z.string().optional(),
  serviceId: z.string().optional(),
  equipmentId: z.string().optional(),
  studioRoomId: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

function computeAverage(reviews: Array<{ rating: number }>) {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({
          message: "Invalid review",
          errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { targetUserId, serviceId, equipmentId, studioRoomId } = parsed.data;
    const targets = [targetUserId, serviceId, equipmentId, studioRoomId].filter(
      Boolean,
    );
    if (targets.length !== 1) {
      return res.status(400).json({
        message:
          "Exactly one review target is required (targetUserId, serviceId, equipmentId, studioRoomId)",
      });
    }

    let targetType: "crew" | "service" | "equipment" | "studio_room" = "crew";
    if (serviceId) targetType = "service";
    if (equipmentId) targetType = "equipment";
    if (studioRoomId) targetType = "studio_room";

    const duplicate = await Review.findOne({
      author: req.user!.id,
      targetType,
      targetUser: targetUserId ?? null,
      service: serviceId ?? null,
      equipment: equipmentId ?? null,
      studioRoom: studioRoomId ?? null,
    }).select("_id");

    if (duplicate) {
      return res
        .status(409)
        .json({ message: "You already reviewed this target" });
    }

    const review = await Review.create({
      author: req.user!.id,
      targetUser: targetUserId,
      service: serviceId,
      equipment: equipmentId,
      studioRoom: studioRoomId,
      targetType,
      revieweeRole: targetType,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    return res.status(201).json({ review });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getCrewReviews = async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await Review.find({
      targetType: "crew",
      targetUser: req.params.crewId,
    })
      .populate("author", "fullName")
      .sort({ createdAt: -1 });
    const avg = computeAverage(reviews);
    return res
      .status(200)
      .json({ reviews, averageRating: avg, count: reviews.length });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getServiceReviews = async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await Review.find({
      targetType: "service",
      service: req.params.serviceId,
    })
      .populate("author", "fullName")
      .sort({ createdAt: -1 });
    const avg = computeAverage(reviews);
    return res
      .status(200)
      .json({ reviews, averageRating: avg, count: reviews.length });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getEquipmentReviews = async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await Review.find({
      targetType: "equipment",
      equipment: req.params.equipmentId,
    })
      .populate("author", "fullName")
      .sort({ createdAt: -1 });
    const avg = computeAverage(reviews);
    return res
      .status(200)
      .json({ reviews, averageRating: avg, count: reviews.length });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getStudioRoomReviews = async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await Review.find({
      targetType: "studio_room",
      studioRoom: req.params.roomId,
    })
      .populate("author", "fullName")
      .sort({ createdAt: -1 });
    const avg = computeAverage(reviews);
    return res
      .status(200)
      .json({ reviews, averageRating: avg, count: reviews.length });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};
