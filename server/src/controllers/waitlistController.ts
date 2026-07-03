import type { Request, Response } from "express";
import Waitlist from "../models/Waitlist";
import Booking from "../models/Booking";
import type { AuthenticatedRequest } from "../types/auth";
import { isPrivilegedRole } from "../utils/user";
import { createNotification } from "../utils/notifications";

const getAuth = (req: Request) => (req as AuthenticatedRequest).user;

// POST /api/waitlist — join waitlist
export const joinWaitlist = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: "Not authorized" });

    const { serviceId, requestedDate, requestedTime, duration } = req.body as {
      serviceId?: string;
      requestedDate?: string;
      requestedTime?: string;
      duration?: number;
    };

    if (!serviceId || !requestedDate || !requestedTime || !duration) {
      return res.status(400).json({ success: false, message: "serviceId, requestedDate, requestedTime, and duration are required" });
    }

    // Check if slot is actually booked
    const conflict = await Booking.findOne({
      service: serviceId,
      bookingDate: new Date(requestedDate),
      bookingTime: requestedTime,
      status: { $nin: ["cancelled"] },
    });

    if (!conflict) {
      return res.status(400).json({ success: false, message: "That slot is currently available. Please book it directly." });
    }

    const existing = await Waitlist.findOne({
      user: auth.id,
      service: serviceId,
      requestedDate: new Date(requestedDate),
      requestedTime,
      status: "waiting",
    });

    if (existing) {
      return res.status(409).json({ success: false, message: "You are already on the waitlist for this slot." });
    }

    const entry = await Waitlist.create({
      user: auth.id,
      service: serviceId,
      requestedDate: new Date(requestedDate),
      requestedTime,
      duration,
    });

    return res.status(201).json({ success: true, message: "Added to waitlist", entry });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Server error" });
  }
};

// GET /api/waitlist/my
export const getMyWaitlist = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: "Not authorized" });

    const entries = await Waitlist.find({ user: auth.id })
      .populate("service", "name price")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, entries });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Server error" });
  }
};

// DELETE /api/waitlist/:id — leave waitlist
export const leaveWaitlist = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: "Not authorized" });

    await Waitlist.findOneAndDelete({ _id: req.params.id, user: auth.id });
    return res.status(200).json({ success: true, message: "Removed from waitlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Server error" });
  }
};

// POST /api/waitlist/notify-slot — admin triggers when slot opens
export const notifyWaitlistForSlot = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const auth = getAuth(req);
    if (!auth || !isPrivilegedRole(auth.role)) return res.status(403).json({ success: false, message: "Forbidden" });

    const { serviceId, date, time } = req.body as { serviceId?: string; date?: string; time?: string };
    if (!serviceId || !date || !time) {
      return res.status(400).json({ success: false, message: "serviceId, date, and time are required" });
    }

    const entries = await Waitlist.find({
      service: serviceId,
      requestedDate: new Date(date),
      requestedTime: time,
      status: "waiting",
    }).populate<{ user: { _id: string; fullName: string } }>("user", "_id fullName");

    let notified = 0;
    for (const entry of entries) {
      await createNotification({
        userId: String(entry.user._id),
        type: "booking",
        title: "Slot Available!",
        message: `A slot you were waiting for on ${new Date(date).toLocaleDateString()} at ${time} is now available. Book now before it's gone!`,
        link: "/bookings/new",
      });
      entry.status = "notified";
      entry.notifiedAt = new Date();
      await entry.save();
      notified++;
    }

    return res.status(200).json({ success: true, notified });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Server error" });
  }
};
