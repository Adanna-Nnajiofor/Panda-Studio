import twilio from 'twilio';
import logger from '../utils/logger';

// ─── Twilio client ────────────────────────────────────────────────────────────

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      '[smsService] TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER must be set.',
    );
  }

  return { client: twilio(accountSid, authToken), fromNumber };
};

export const isTwilioConfigured = (): boolean =>
  Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER,
  );

// ─── Base send helper ─────────────────────────────────────────────────────────

export const sendSMS = async (to: string, body: string): Promise<boolean> => {
  if (!isTwilioConfigured()) {
    logger.warn('[sms] Twilio not configured — SMS skipped', { to });
    return false;
  }

  try {
    const { client, fromNumber } = getTwilioClient();
    const message = await client.messages.create({ body, from: fromNumber, to });
    logger.info('[sms] Sent', { to, sid: message.sid });
    return true;
  } catch (error) {
    logger.error('[sms] Failed to send', { to, error });
    return false;
  }
};

// ─── SMS templates ────────────────────────────────────────────────────────────

export const sendBookingConfirmationSMS = (phone: string, booking: any, userName = 'Customer') =>
  sendSMS(
    phone,
    `Hi ${userName}, your Panda Studio booking (${booking.referenceNumber}) is confirmed for ${new Date(booking.bookingDate).toLocaleDateString()} at ${booking.bookingTime}. See you soon!`,
  );

export const sendPaymentSuccessSMS = (phone: string, booking: any, amount: number, userName = 'Customer') =>
  sendSMS(
    phone,
    `Hi ${userName}, payment of ₦${amount?.toLocaleString()} received for booking ${booking.referenceNumber}. Thank you! - Panda Studio`,
  );

export const sendBookingReminderSMS = (phone: string, booking: any, userName = 'Customer') =>
  sendSMS(
    phone,
    `Hi ${userName}, reminder: your Panda Studio booking (${booking.referenceNumber}) is tomorrow at ${booking.bookingTime}. Contact us to reschedule.`,
  );

export const sendAccountApprovedSMS = (phone: string, userName = 'there') =>
  sendSMS(
    phone,
    `Hi ${userName}, your Panda Studio account has been approved! Log in to start accepting jobs.`,
  );
