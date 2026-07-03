import type { Response } from "express";
import Booking from "../models/Booking";
import Equipment from "../models/Equipment";
import Invoice from "../models/Invoice";
import Project from "../models/Project";
import User from "../models/User";
import logger from "../utils/logger";

// Lightweight global search response for the front-end.
// Note: crew/studios directory is fetched in another endpoint.
// For now, this controller returns equipment + categories + projects.
// We will integrate crew directory search in a follow-up step.

export async function searchGlobal(req: any, res: Response) {
  try {
    const query = (req.query.query ?? "").toString().trim();
    const scope = (req.query.scope ?? "all").toString().trim().toLowerCase();
    const includeAll = scope === "all";

    if (!query) {
      return res.status(200).json({
        equipment: [],
        crew: [],
        projects: [],
        bookings: [],
        invoices: [],
        clients: [],
        categories: [],
      });
    }

    const q = query;

    const [equipment, crew, projects, bookings, invoices, clients] =
      await Promise.all([
        includeAll || scope === "equipment"
          ? Equipment.find({
              isActive: true,
              $or: [
                { name: { $regex: q, $options: "i" } },
                { type: { $regex: q, $options: "i" } },
                { brand: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
              ],
            })
              .limit(24)
              .lean()
          : Promise.resolve([]),
        includeAll || scope === "crew"
          ? User.find({
              role: "crew",
              isActive: true,
              isApproved: true,
              $or: [
                { fullName: { $regex: q, $options: "i" } },
                { position: { $regex: q, $options: "i" } },
                { department: { $regex: q, $options: "i" } },
                { bio: { $regex: q, $options: "i" } },
              ],
            })
              .select("fullName position department bio avatar availability")
              .limit(24)
              .lean()
          : Promise.resolve([]),
        includeAll || scope === "projects"
          ? Project.find({
              $or: [{ progressStatus: { $regex: q, $options: "i" } }],
            })
              .populate("client", "fullName")
              .limit(24)
              .lean()
          : Promise.resolve([]),
        includeAll || scope === "bookings"
          ? Booking.find({
              $or: [
                { referenceNumber: { $regex: q, $options: "i" } },
                { bookingTime: { $regex: q, $options: "i" } },
                { status: { $regex: q, $options: "i" } },
              ],
            })
              .populate("user", "fullName email")
              .populate("service", "name")
              .limit(24)
              .lean()
          : Promise.resolve([]),
        includeAll || scope === "invoices"
          ? Invoice.find({
              $or: [
                { referenceNumber: { $regex: q, $options: "i" } },
                { status: { $regex: q, $options: "i" } },
                { couponCode: { $regex: q, $options: "i" } },
              ],
            })
              .populate("client", "fullName email")
              .limit(24)
              .lean()
          : Promise.resolve([]),
        includeAll || scope === "clients"
          ? User.find({
              role: "client",
              isActive: true,
              $or: [
                { fullName: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
                { phone: { $regex: q, $options: "i" } },
              ],
            })
              .select("fullName email phone avatar")
              .limit(24)
              .lean()
          : Promise.resolve([]),
      ]);

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

    return res.status(200).json({
      equipment: equipmentNormalized,
      crew,
      projects,
      bookings,
      invoices,
      clients,
      categories,
    });
  } catch (error) {
    logger.error("searchGlobal error", { error });
    return res.status(500).json({ message: "Server error" });
  }
}

// Dedicated crew search with filters
export async function searchCrew(req: any, res: Response) {
  try {
    const {
      query = "",
      department,
      availability,
      minRate,
      maxRate,
    } = req.query as Record<string, string>;

    const filter: Record<string, any> = {
      role: "crew",
      isActive: true,
      isApproved: true,
    };

    if (query.trim()) {
      filter.$or = [
        { fullName: { $regex: query.trim(), $options: "i" } },
        { position: { $regex: query.trim(), $options: "i" } },
        { department: { $regex: query.trim(), $options: "i" } },
        { bio: { $regex: query.trim(), $options: "i" } },
      ];
    }

    if (department) filter.department = { $regex: department, $options: "i" };
    if (availability) filter.availability = availability;

    const crew = await User.find(filter)
      .select(
        "fullName position department bio avatar availability assignedProjects",
      )
      .sort({ fullName: 1 })
      .limit(50)
      .lean();

    return res.status(200).json({ success: true, count: crew.length, crew });
  } catch (error) {
    logger.error("searchCrew error", { error });
    return res.status(500).json({ message: "Server error" });
  }
}
