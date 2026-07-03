import type { Response } from "express";
import logger from "../utils/logger";
import Booking from "../models/Booking";
import Notification from "../models/Notification";
import { sendNotification } from "../services/notificationService";
import type { AuthRequest } from "../types/auth";

// GET /api/notifications
export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.user!.id,
      isRead: false,
    });

    return res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    logger.error("[notifications] getMyNotifications error", { error });
    return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

// PATCH /api/notifications/:id/read
export const markOneRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user!.id },
      { isRead: true },
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("[notifications] markOneRead error", { error });
    return res.status(500).json({ success: false, message: "Failed to mark notification" });
  }
};

// PATCH /api/notifications/read-all
export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ user: req.user!.id, isRead: false }, { isRead: true });
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("[notifications] markAllRead error", { error });
    return res.status(500).json({ success: false, message: "Failed to mark all read" });
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("[notifications] deleteNotification error", { error });
    return res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};

// DELETE /api/notifications
export const clearAllNotifications = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.deleteMany({ user: req.user!.id });
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("[notifications] clearAll error", { error });
    return res.status(500).json({ success: false, message: "Failed to clear notifications" });
  }
};

// POST /api/notifications/send-booking-reminders (admin)
export const sendBookingRemindersAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(now.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowStart.getDate() + 1);

    const bookings = await Booking.find({
      bookingDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
      status: { $nin: ["cancelled"] },
      paymentStatus: { $in: ["paid", "deposit_paid"] },
    })
      .populate("user", "fullName email")
      .populate("service", "name")
      .sort({ bookingTime: 1 });

    let sent = 0;
    let failed = 0;

    for (const booking of bookings) {
      const user = booking.user as unknown as { email?: string; fullName?: string };
      if (!user?.email) { failed++; continue; }
      const ok = await sendNotification({
        type: "booking_reminder",
        email: user.email,
        booking: booking as any,
        userName: user.fullName || "Customer",
      });
      if (ok) sent++;
      else failed++;
    }

    return res.status(200).json({ success: true, sent, failed, total: bookings.length });
  } catch (error) {
    logger.error("[notifications] sendBookingRemindersAdmin error", { error });
    return res.status(500).json({ success: false, message: "Failed to send reminders" });
  }
};
