import type { Response } from "express";
import { z } from "zod";
import StudioRoom from "../models/StudioRoom";
import { cacheAside, cacheDel, invalidatePattern } from "../utils/cache";
import logger from "../utils/logger";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";

const CACHE_KEY_ALL = "studioRooms:all";
const CACHE_KEY_FEATURED = "studioRooms:featured";
const cacheKeyById = (id: string) => `studioRooms:${id}`;
const CACHE_TTL = 60 * 10; // 10 minutes

const createStudioRoomSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  capacity: z.number().int().positive(),
  amenities: z.array(z.string()).optional().default([]),
  basePrice: z.number().positive(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  images: z.array(z.string().url()).optional(),
});

const removeStudioRoomImageSchema = z.object({
  url: z.string().url(),
});

const reorderStudioRoomImagesSchema = z.object({
  images: z.array(z.string().url()).max(30),
});

export const createStudioRoom = async (req: any, res: Response) => {
  try {
    const parsed = createStudioRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid studio room payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const room = await StudioRoom.create(parsed.data);
    await invalidatePattern("studioRooms:");

    return res.status(201).json({
      message: "Studio room created",
      room,
    });
  } catch (error) {
    logger.error("createStudioRoom error", { error });
    return res.status(500).json({ message: "Server error" });
  }
};

export const getStudioRooms = async (_req: any, res: Response) => {
  try {
    const rooms = await cacheAside(
      CACHE_KEY_ALL,
      () =>
        StudioRoom.find({ isActive: true })
          .sort({ isFeatured: -1, name: 1 })
          .lean(),
      CACHE_TTL,
    );

    return res.status(200).json({ rooms });
  } catch (error) {
    logger.error("getStudioRooms error", { error });
    return res.status(500).json({ message: "Server error" });
  }
};

export const getFeaturedStudioRooms = async (_req: any, res: Response) => {
  try {
    const rooms = await cacheAside(
      CACHE_KEY_FEATURED,
      () =>
        StudioRoom.find({ isActive: true, isFeatured: true })
          .sort({ updatedAt: -1, name: 1 })
          .limit(6)
          .lean(),
      CACHE_TTL,
    );

    return res.status(200).json({ rooms });
  } catch (error) {
    logger.error("getFeaturedStudioRooms error", { error });
    return res.status(500).json({ message: "Server error" });
  }
};

export const getStudioRoomsAdmin = async (_req: any, res: Response) => {
  try {
    const rooms = await StudioRoom.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ rooms });
  } catch (error) {
    logger.error("getStudioRoomsAdmin error", { error });
    return res.status(500).json({ message: "Server error" });
  }
};

export const getStudioRoomById = async (req: any, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id)
      return res.status(400).json({ message: "Studio room ID is required" });

    const room = await cacheAside(
      cacheKeyById(id),
      () => StudioRoom.findById(id).lean(),
      CACHE_TTL,
    );

    if (!room)
      return res.status(404).json({ message: "Studio room not found" });

    return res.status(200).json({ room });
  } catch (error) {
    logger.error("getStudioRoomById error", { error });
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateStudioRoom = async (req: any, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id)
      return res.status(400).json({ message: "Studio room ID is required" });

    const parsed = createStudioRoomSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid studio room update payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const room = await StudioRoom.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    });

    if (!room)
      return res.status(404).json({ message: "Studio room not found" });

    await cacheDel(cacheKeyById(id));
    await cacheDel(CACHE_KEY_ALL);
    await cacheDel(CACHE_KEY_FEATURED);

    return res.status(200).json({ message: "Studio room updated", room });
  } catch (error) {
    logger.error("updateStudioRoom error", { error });
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteStudioRoom = async (req: any, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id)
      return res.status(400).json({ message: "Studio room ID is required" });

    const room = await StudioRoom.findByIdAndDelete(id);
    if (!room)
      return res.status(404).json({ message: "Studio room not found" });

    await cacheDel(cacheKeyById(id));
    await cacheDel(CACHE_KEY_ALL);
    await cacheDel(CACHE_KEY_FEATURED);

    return res.status(200).json({ message: "Studio room deleted" });
  } catch (error) {
    logger.error("deleteStudioRoom error", { error });
    return res.status(500).json({ message: "Server error" });
  }
};

export const uploadStudioRoomImages = async (req: any, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id)
      return res.status(400).json({ message: "Studio room ID is required" });

    const room = await StudioRoom.findById(id);
    if (!room)
      return res.status(404).json({ message: "Studio room not found" });

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const uploadResults = await Promise.allSettled(
      files.map((file) =>
        uploadToCloudinary(file.buffer, file.mimetype, {
          folder: `panda-studio/studio-rooms/${id}`,
        }),
      ),
    );

    const urls = uploadResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<{ url: string }>).value.url);

    if (urls.length === 0)
      return res.status(500).json({ message: "All image uploads failed" });

    room.images = [...(room.images ?? []), ...urls];
    await room.save();

    await cacheDel(cacheKeyById(id));
    await cacheDel(CACHE_KEY_ALL);
    await cacheDel(CACHE_KEY_FEATURED);

    return res.status(200).json({
      message: `${urls.length} image(s) uploaded`,
      room,
      images: room.images,
    });
  } catch (error) {
    logger.error("uploadStudioRoomImages error", { error });
    return res.status(500).json({ message: "Server error" });
  }
};

export const removeStudioRoomImage = async (req: any, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id)
      return res.status(400).json({ message: "Studio room ID is required" });

    const parsed = removeStudioRoomImageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid remove image payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const room = await StudioRoom.findById(id);
    if (!room)
      return res.status(404).json({ message: "Studio room not found" });

    const current = room.images ?? [];
    const next = current.filter((imageUrl) => imageUrl !== parsed.data.url);

    if (next.length === current.length) {
      return res.status(404).json({ message: "Image not found on room" });
    }

    room.images = next;
    await room.save();

    await cacheDel(cacheKeyById(id));
    await cacheDel(CACHE_KEY_ALL);
    await cacheDel(CACHE_KEY_FEATURED);

    return res.status(200).json({
      message: "Image removed",
      images: room.images,
      room,
    });
  } catch (error) {
    logger.error("removeStudioRoomImage error", { error });
    return res.status(500).json({ message: "Server error" });
  }
};

export const reorderStudioRoomImages = async (req: any, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id)
      return res.status(400).json({ message: "Studio room ID is required" });

    const parsed = reorderStudioRoomImagesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid image reorder payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const room = await StudioRoom.findById(id);
    if (!room)
      return res.status(404).json({ message: "Studio room not found" });

    const current = room.images ?? [];
    const requested = parsed.data.images;

    if (current.length !== requested.length) {
      return res.status(400).json({
        message: "Image reorder payload must include all existing images",
      });
    }

    const currentSet = new Set(current);
    const requestedSet = new Set(requested);

    if (requestedSet.size !== requested.length) {
      return res
        .status(400)
        .json({ message: "Duplicate image URLs are not allowed" });
    }

    for (const url of requestedSet) {
      if (!currentSet.has(url)) {
        return res.status(400).json({
          message: "Reorder payload contains unknown image URL",
        });
      }
    }

    room.images = requested;
    await room.save();

    await cacheDel(cacheKeyById(id));
    await cacheDel(CACHE_KEY_ALL);
    await cacheDel(CACHE_KEY_FEATURED);

    return res.status(200).json({
      message: "Image order updated",
      images: room.images,
      room,
    });
  } catch (error) {
    logger.error("reorderStudioRoomImages error", { error });
    return res.status(500).json({ message: "Server error" });
  }
};
