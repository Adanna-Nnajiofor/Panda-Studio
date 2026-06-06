import type { Response } from "express";
import { z } from "zod";
import Equipment from "../models/Equipment";
import { AuthRequest } from "../types/auth";
import { cacheAside, cacheDel, invalidatePattern } from "../utils/cache";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import logger from "../utils/logger";

const CACHE_KEY_ALL = "equipment:all";
const cacheKeyById = (id: string) => `equipment:${id}`;
const CACHE_TTL = 60 * 10; // 10 minutes

const createEquipmentSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  description: z.string().optional(),
  hourlyRate: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  isActive: z.boolean().optional(),
  images: z.array(z.string().url()).optional(),
});

export const createEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createEquipmentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid equipment payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const equipment = await Equipment.create(parsed.data);

    await invalidatePattern("equipment:");

    return res.status(201).json({
      message: "Equipment created",
      equipment,
    });
  } catch (error) {
    logger.error("createEquipment error", { error });

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getEquipment = async (_req: AuthRequest, res: Response) => {
  try {
    const equipment = await cacheAside(
      CACHE_KEY_ALL,
      () => Equipment.find({ isActive: true }).sort({ name: 1 }).lean(),
      CACHE_TTL,
    );

    return res.status(200).json({ equipment });
  } catch (error) {
    logger.error("getEquipment error", { error });

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getEquipmentById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      return res.status(400).json({
        message: "Equipment ID is required",
      });
    }

    const equipment = await cacheAside(
      cacheKeyById(id),
      () => Equipment.findById(id).lean(),
      CACHE_TTL,
    );

    if (!equipment) {
      return res.status(404).json({
        message: "Equipment not found",
      });
    }

    return res.status(200).json({ equipment });
  } catch (error) {
    logger.error("getEquipmentById error", { error });

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      return res.status(400).json({
        message: "Equipment ID is required",
      });
    }

    const parsed = createEquipmentSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid equipment update payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const equipment = await Equipment.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    });

    if (!equipment) {
      return res.status(404).json({
        message: "Equipment not found",
      });
    }

    await cacheDel(cacheKeyById(id));
    await cacheDel(CACHE_KEY_ALL);

    return res.status(200).json({
      message: "Equipment updated",
      equipment,
    });
  } catch (error) {
    logger.error("updateEquipment error", { error });

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const deleteEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Equipment ID is required" });
    }

    const equipment = await Equipment.findByIdAndDelete(id);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    await cacheDel(cacheKeyById(id));
    await cacheDel(CACHE_KEY_ALL);

    return res.status(200).json({ message: "Equipment deleted" });
  } catch (error) {
    logger.error("deleteEquipment error", { error });
    return res.status(500).json({ message: "Server error" });
  }
};

// Upload images for a piece of equipment (admin only)
// Accepts multipart/form-data with field name "images" (up to 5 files)
export const uploadEquipmentImages = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ message: "Equipment ID is required" });

    const equipment = await Equipment.findById(id);
    if (!equipment) return res.status(404).json({ message: "Equipment not found" });

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    // Upload each file to Cloudinary
    const uploadResults = await Promise.allSettled(
      files.map((file) =>
        uploadToCloudinary(file.buffer, file.mimetype, {
          folder: `panda-studio/equipment/${id}`,
        }),
      ),
    );

    const urls = uploadResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<{ url: string }>).value.url);

    if (urls.length === 0) {
      return res.status(500).json({ message: "All image uploads failed" });
    }

    // Append new URLs to existing images array
    equipment.images = [...(equipment.images ?? []), ...urls];
    await equipment.save();

    await cacheDel(cacheKeyById(id));
    await cacheDel(CACHE_KEY_ALL);

    return res.status(200).json({
      message: `${urls.length} image(s) uploaded`,
      images: equipment.images,
      equipment,
    });
  } catch (error) {
    logger.error("uploadEquipmentImages error", { error });
    return res.status(500).json({ message: "Server error" });
  }
};
