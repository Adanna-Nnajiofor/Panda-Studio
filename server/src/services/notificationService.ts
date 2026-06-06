import { IBooking } from '../models/Booking';
import logger from '../utils/logger';
import {
  sendBookingConfirmationEmail,
  sendPaymentSuccessEmail,
  sendBookingReminderEmail,
  sendWelcomeEmail,
  sendAccountApprovedEmail,
} from './emailService';
import {
  sendBookingConfirmationSMS,
  sendPaymentSuccessSMS,
  sendBookingReminderSMS,
  sendAccountApprovedSMS,
} from './smsService';

// ─── Payload types ────────────────────────────────────────────────────────────

export interface NotificationPayload {
  type:
    | 'booking_confirmed'
    | 'payment_success'
    | 'booking_reminder'
    | 'welcome'
    | 'account_approved';
  email: string;
  phone?: string;
  booking?: IBooking | any;
  amount?: number;
  userName?: string;
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export const sendNotification = async (payload: NotificationPayload): Promise<boolean> => {
  const { type, email, phone, booking, amount, userName } = payload;

  try {
    switch (type) {
      case 'booking_confirmed': {
        const results = await Promise.allSettled([
          sendBookingConfirmationEmail(email, booking, userName),
          phone ? sendBookingConfirmationSMS(phone, booking, userName) : Promise.resolve(false),
        ]);
        return results.some((r) => r.status === 'fulfilled' && r.value === true);
      }

      case 'payment_success': {
        const results = await Promise.allSettled([
          sendPaymentSuccessEmail(email, booking, amount ?? 0, userName),
          phone ? sendPaymentSuccessSMS(phone, booking, amount ?? 0, userName) : Promise.resolve(false),
        ]);
        return results.some((r) => r.status === 'fulfilled' && r.value === true);
      }

      case 'booking_reminder': {
        const results = await Promise.allSettled([
          sendBookingReminderEmail(email, booking, userName),
          phone ? sendBookingReminderSMS(phone, booking, userName) : Promise.resolve(false),
        ]);
        return results.some((r) => r.status === 'fulfilled' && r.value === true);
      }

      case 'welcome':
        return sendWelcomeEmail(email, userName ?? 'there');

      case 'account_approved': {
        const results = await Promise.allSettled([
          sendAccountApprovedEmail(email, userName ?? 'there'),
          phone ? sendAccountApprovedSMS(phone, userName) : Promise.resolve(false),
        ]);
        return results.some((r) => r.status === 'fulfilled' && r.value === true);
      }

      default:
        logger.warn('[notification] Unknown type', { type });
        return false;
    }
  } catch (error) {
    logger.error('[notification] Dispatch error', { type, error });
    return false;
  }
};

// ─── Batch reminder job ───────────────────────────────────────────────────────

export const sendBookingReminders = async (): Promise<void> => {
  // Called by a scheduler (e.g. node-cron) every 24 hours
  // to send reminders for bookings happening tomorrow.
  // Import Booking here to avoid circular deps at module load.
  const Booking = (await import('../models/Booking')).default;

  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(now.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowStart.getDate() + 1);

  try {
    const bookings = await Booking.find({
      bookingDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
      status: { $nin: ['cancelled'] },
      paymentStatus: { $in: ['paid', 'deposit_paid'] },
    })
      .populate('user', 'fullName email phone')
      .populate('service', 'name');

    logger.info('[notification] Sending reminders', { count: bookings.length });

    let sent = 0;
    for (const booking of bookings) {
      const user = booking.user as any;
      if (!user?.email) continue;

      const ok = await sendNotification({
        type: 'booking_reminder',
        email: user.email,
        phone: user.phone,
        booking,
        userName: user.fullName ?? 'Customer',
      });

      if (ok) sent++;
    }

    logger.info('[notification] Reminders complete', { sent, total: bookings.length });
  } catch (error) {
    logger.error('[notification] Reminder job failed', { error });
  }
};
