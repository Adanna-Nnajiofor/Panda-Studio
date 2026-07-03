import type { Request, Response } from "express";
import FilmOpsProject from "../models/FilmOpsProject";
import type { AuthenticatedRequest } from "../types/auth";
import { logAudit } from "../utils/audit";

const getOwnerId = (req: Request) => (req as AuthenticatedRequest).user?.id;

export const createFilmOpsProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const owner = getOwnerId(req);
    if (!owner) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const record = await FilmOpsProject.create({ ...req.body, owner });

    await logAudit({
      req,
      action: "create",
      entityType: "film_ops_project",
      entityId: String(record._id),
      message: `Film ops project created: ${record.title}`,
    });

    res.status(201).json({ success: true, record });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create film ops project",
    });
  }
};

export const listFilmOpsProjects = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const records = await FilmOpsProject.find()
      .populate("project", "_id progressStatus")
      .populate("owner", "fullName email role")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: records.length, records });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch film ops projects" });
  }
};

export const getFilmOpsProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const record = await FilmOpsProject.findById(req.params.id)
      .populate("project", "_id progressStatus")
      .populate("owner", "fullName email role")
      .populate("attendance.user", "fullName role email");

    if (!record) {
      res
        .status(404)
        .json({ success: false, message: "Film ops project not found" });
      return;
    }

    res.json({ success: true, record });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch film ops project" });
  }
};

export const addCallSheet = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const record = await FilmOpsProject.findById(req.params.id);
    if (!record) {
      res
        .status(404)
        .json({ success: false, message: "Film ops project not found" });
      return;
    }

    record.callSheets.push(req.body);
    await record.save();

    await logAudit({
      req,
      action: "create",
      entityType: "film_call_sheet",
      entityId: String(record._id),
      message: `Call sheet added to ${record.title}`,
    });

    res.status(201).json({ success: true, record });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to add call sheet" });
  }
};

export const addDailyProductionReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const record = await FilmOpsProject.findById(req.params.id);
    if (!record) {
      res
        .status(404)
        .json({ success: false, message: "Film ops project not found" });
      return;
    }

    record.dprs.push(req.body);
    await record.save();

    await logAudit({
      req,
      action: "create",
      entityType: "film_dpr",
      entityId: String(record._id),
      message: `DPR added to ${record.title}`,
    });

    res.status(201).json({ success: true, record });
  } catch {
    res.status(500).json({ success: false, message: "Failed to add DPR" });
  }
};

export const addAttendanceEntry = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const record = await FilmOpsProject.findById(req.params.id);
    if (!record) {
      res
        .status(404)
        .json({ success: false, message: "Film ops project not found" });
      return;
    }

    record.attendance.push(req.body);
    await record.save();

    await logAudit({
      req,
      action: "create",
      entityType: "film_attendance",
      entityId: String(record._id),
      message: `Attendance entry added to ${record.title}`,
    });

    res.status(201).json({ success: true, record });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to add attendance" });
  }
};

export const addLocationEntry = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const record = await FilmOpsProject.findById(req.params.id);
    if (!record) {
      res
        .status(404)
        .json({ success: false, message: "Film ops project not found" });
      return;
    }

    record.locations.push(req.body);
    await record.save();

    await logAudit({
      req,
      action: "create",
      entityType: "film_location",
      entityId: String(record._id),
      message: `Location added to ${record.title}`,
    });

    res.status(201).json({ success: true, record });
  } catch {
    res.status(500).json({ success: false, message: "Failed to add location" });
  }
};

export const addTalentEntry = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const record = await FilmOpsProject.findById(req.params.id);
    if (!record) {
      res
        .status(404)
        .json({ success: false, message: "Film ops project not found" });
      return;
    }

    record.talents.push(req.body);
    await record.save();

    await logAudit({
      req,
      action: "create",
      entityType: "film_talent",
      entityId: String(record._id),
      message: `Talent added to ${record.title}`,
    });

    res.status(201).json({ success: true, record });
  } catch {
    res.status(500).json({ success: false, message: "Failed to add talent" });
  }
};
