import type { Request, Response } from "express";
import StudioBooking from "../models/StudioBooking";
import type { AuthenticatedRequest } from "../types/auth";
import { isPrivilegedRole } from "../utils/user";

const authUser = (req: Request) => (req as AuthenticatedRequest).user;

export const createStudioBooking = async (req: Request, res: Response) => {
  try {
    const user = authUser(req);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const { studioRoom, bookingDate, bookingTime, durationHours, totalAmount } =
      req.body as Record<string, unknown>;
    if (
      !studioRoom ||
      !bookingDate ||
      !bookingTime ||
      !durationHours ||
      !totalAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "studioRoom, bookingDate, bookingTime, durationHours, and totalAmount are required",
      });
    }

    const conflict = await StudioBooking.findOne({
      studioRoom,
      bookingDate: new Date(String(bookingDate)),
      bookingTime,
      status: { $nin: ["cancelled"] },
    }).select("_id");

    if (conflict) {
      return res
        .status(409)
        .json({
          success: false,
          message: "This studio slot is already booked",
        });
    }

    const booking = await StudioBooking.create({
      ...req.body,
      user: user.id,
      bookingDate: new Date(String(bookingDate)),
    });

    return res.status(201).json({ success: true, booking });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create studio booking",
      });
  }
};

export const listStudioBookings = async (req: Request, res: Response) => {
  try {
    const user = authUser(req);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const query: Record<string, unknown> = isPrivilegedRole(user.role)
      ? {}
      : { user: user.id };

    const bookings = await StudioBooking.find(query)
      .populate("user", "fullName email")
      .populate("studioRoom", "name slug capacity")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch studio bookings",
      });
  }
};

export const updateStudioBookingStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const booking = await StudioBooking.findByIdAndUpdate(
      req.params.id,
      { $set: { status: req.body?.status } },
      { new: true, runValidators: true },
    );

    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Studio booking not found" });
    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update studio booking",
      });
  }
};
