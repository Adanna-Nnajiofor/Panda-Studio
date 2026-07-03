import type { Request, Response } from "express";
import EquipmentBooking from "../models/EquipmentBooking";
import type { AuthenticatedRequest } from "../types/auth";
import { isPrivilegedRole } from "../utils/user";

const authUser = (req: Request) => (req as AuthenticatedRequest).user;

export const createEquipmentBooking = async (req: Request, res: Response) => {
  try {
    const user = authUser(req);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const { equipment, quantity, startDate, endDate, totalAmount } =
      req.body as Record<string, unknown>;
    if (!equipment || !startDate || !endDate || !totalAmount) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "equipment, startDate, endDate, and totalAmount are required",
        });
    }

    const booking = await EquipmentBooking.create({
      ...req.body,
      user: user.id,
      quantity: Number(quantity ?? 1),
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
            : "Failed to create equipment booking",
      });
  }
};

export const listEquipmentBookings = async (req: Request, res: Response) => {
  try {
    const user = authUser(req);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const query: Record<string, unknown> = isPrivilegedRole(user.role)
      ? {}
      : { user: user.id };

    const bookings = await EquipmentBooking.find(query)
      .populate("user", "fullName email")
      .populate("equipment", "name type")
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
            : "Failed to fetch equipment bookings",
      });
  }
};

export const updateEquipmentBookingStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const booking = await EquipmentBooking.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: req.body?.status,
          paymentStatus: req.body?.paymentStatus,
        },
      },
      { new: true, runValidators: true },
    );

    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Equipment booking not found" });
    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update equipment booking",
      });
  }
};
