import type { Response } from "express";
import Equipment from "../models/Equipment";
import Project from "../models/Project";
import logger from "../utils/logger";

// Lightweight global search response for the front-end.
// Note: crew/studios directory is fetched in another endpoint.
// For now, this controller returns equipment + categories + projects.
// We will integrate crew directory search in a follow-up step.

export async function searchGlobal(req: any, res: Response) {
  try {
    const query = (req.query.query ?? "").toString().trim();

    if (!query) {
      return res.status(200).json({
        equipment: [],
        categories: [],
        studios: [],
        availability: [],
      });
    }

    const q = query;

    const equipment = await Equipment.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { type: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    })
      .limit(24)
      .lean();

    // Standardize pricing for the UI: rentals are per day.
    // Daily rate fallback: if dailyRate missing, derive from hourlyRate.
    const equipmentNormalized = (equipment ?? []).map((e: any) => {
      const dailyRate =
        typeof e.dailyRate === "number" ? e.dailyRate : e.hourlyRate * 8;

      return {
        ...e,
        pricePerDay: dailyRate,
        // Keep hourlyRate for any existing screens, but flag per-day pricing
        // in responses going forward.
        pricePerHour: e.hourlyRate,
      };
    });

    const categories = Array.from(
      new Set(
        equipment
          .map((e: any) => e.type)
          .filter(Boolean)
          .map((t: string) => t),
      ),
    );

    const projects = await Project.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    })
      .limit(24)
      .lean();

    return res.status(200).json({
      equipment: equipmentNormalized,
      categories,
      studios: projects,
      availability: [],
    });
  } catch (error) {
    logger.error("searchGlobal error", { error });
    return res.status(500).json({ message: "Server error" });
  }
}
