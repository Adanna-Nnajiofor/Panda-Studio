import type { Response } from "express";
import logger from "../utils/logger";
import Booking from "../models/Booking";
import { sendNotification } from "../services/notificationService";
import type { AuthRequest } from "../types/auth";

// Admin endpoint to manually trigger booking reminders
export const sendBookingRemindersAdmin = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // Determine "tomorrow" in server local time
    const now = new Date();
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(now.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setMilliseconds(0);
    tomorrowEnd.setDate(tomorrowStart.getDate() + 1);

    const bookings = await Booking.find({
      bookingDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
      status: { $nin: ["cancelled"] },
      paymentStatus: { $in: ["paid", "deposit_paid"] },
    })
      .populate("user", "fullName email")
      .populate("service", "name")
      .sort({ bookingTime: 1 });

    // Send emails
    let sent = 0;
    let failed = 0;

    for (const booking of bookings) {
      const user = booking.user as unknown as {
        email?: string;
        fullName?: string;
      };
      if (!user?.email) {
        failed += 1;
        continue;
      }

      const ok = await sendNotification({
        type: "booking_reminder",
        email: user.email,
        booking: booking as any,
        userName: user.fullName || "Customer",
      });

      if (ok) sent += 1;
      else failed += 1;
    }

    return res.status(200).json({
      success: true,
      sent,
      failed,
      total: bookings.length,
    });
  } catch (error) {
    logger.error('[notificationController] sendBookingRemindersAdmin error', { error });
    return res.status(500).json({ success: false, message: 'Failed to send booking reminders' });
  }
};
