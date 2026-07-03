import type { Request, Response } from "express";
import AvailabilitySchedule from "../models/AvailabilitySchedule";
import type { AuthenticatedRequest } from "../types/auth";
import { isPrivilegedRole } from "../utils/user";

const authUser = (req: Request) => (req as AuthenticatedRequest).user;

export const getMyAvailabilitySchedule = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = authUser(req);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const entries = await AvailabilitySchedule.find({ user: user.id }).sort({
      dayOfWeek: 1,
    });
    return res
      .status(200)
      .json({ success: true, count: entries.length, entries });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch availability schedule",
      });
  }
};

export const upsertMyAvailabilitySchedule = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = authUser(req);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const { dayOfWeek, startTime, endTime, timezone, isAvailable } =
      req.body as {
        dayOfWeek?: number;
        startTime?: string;
        endTime?: string;
        timezone?: string;
        isAvailable?: boolean;
      };

    if (dayOfWeek === undefined || !startTime || !endTime) {
      return res
        .status(400)
        .json({
          success: false,
          message: "dayOfWeek, startTime and endTime are required",
        });
    }

    const entry = await AvailabilitySchedule.findOneAndUpdate(
      { user: user.id, dayOfWeek },
      {
        $set: {
          startTime,
          endTime,
          timezone: timezone ?? "Africa/Lagos",
          isAvailable: isAvailable ?? true,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    return res.status(200).json({ success: true, entry });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to save availability schedule",
      });
  }
};

export const deleteMyAvailabilitySchedule = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = authUser(req);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    await AvailabilitySchedule.findOneAndDelete({
      user: user.id,
      _id: req.params.id,
    });
    return res
      .status(200)
      .json({ success: true, message: "Availability entry deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete availability entry",
      });
  }
};

export const getUserAvailabilitySchedule = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = authUser(req);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    if (!isPrivilegedRole(user.role) && user.id !== req.params.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const entries = await AvailabilitySchedule.find({
      user: req.params.userId,
    }).sort({ dayOfWeek: 1 });
    return res
      .status(200)
      .json({ success: true, count: entries.length, entries });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch user availability schedule",
      });
  }
};
