import nodemailer from 'nodemailer';
import logger from '../utils/logger';

// ─── Transporter ──────────────────────────────────────────────────────────────

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const secure = process.env.SMTP_SECURE === 'true';

  if (!host || !user || !pass) {
    throw new Error('[emailService] SMTP_HOST, SMTP_USER, and SMTP_PASS must be set.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: true },
  });
};

const FROM = process.env.SMTP_FROM ?? 'Panda Studio <noreply@pandastudio.com>';

// ─── Base send helper ─────────────────────────────────────────────────────────

const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    await getTransporter().sendMail({ from: FROM, to, subject, html });
    logger.info('[email] Sent', { to, subject });
    return true;
  } catch (error) {
    logger.error('[email] Failed to send', { to, subject, error });
    return false;
  }
};

// ─── Templates ────────────────────────────────────────────────────────────────

const baseTemplate = (content: string) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9;">
    <div style="background:#fff;border-radius:8px;padding:30px;border:1px solid #e0e0e0;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#1a1a1a;font-size:24px;margin:0;">🐼 Panda Studio</h1>
      </div>
      ${content}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="color:#999;font-size:12px;text-align:center;">
        © ${new Date().getFullYear()} Panda Studio. All rights reserved.
      </p>
    </div>
  </div>
`;

// ─── Email functions ──────────────────────────────────────────────────────────

export const sendBookingConfirmationEmail = (
  email: string,
  booking: any,
  userName = 'Customer',
) =>
  sendEmail(
    email,
    `Booking Confirmed – ${booking.referenceNumber}`,
    baseTemplate(`
      <h2 style="color:#2e7d32;">✅ Booking Confirmed!</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Your booking has been confirmed. Here are the details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">Reference</td>
            <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${booking.referenceNumber}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">Service</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${booking.service?.name ?? 'Professional Service'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">Date</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${new Date(booking.bookingDate).toLocaleDateString()}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">Time</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${booking.bookingTime}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">Duration</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${booking.duration} hour(s)</td></tr>
        <tr><td style="padding:8px;color:#555;">Total Amount</td>
            <td style="padding:8px;font-weight:bold;color:#2e7d32;">₦${booking.totalAmount?.toLocaleString()}</td></tr>
      </table>
      <p>Thank you for booking with Panda Studio!</p>
    `),
  );

export const sendPaymentSuccessEmail = (
  email: string,
  booking: any,
  amount: number,
  userName = 'Customer',
) =>
  sendEmail(
    email,
    `Payment Confirmed – ${booking.referenceNumber}`,
    baseTemplate(`
      <h2 style="color:#1565c0;">💳 Payment Successful!</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Your payment of <strong>₦${amount?.toLocaleString()}</strong> has been processed successfully.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">Reference</td>
            <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${booking.referenceNumber}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">Service</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${booking.service?.name ?? 'Professional Service'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">Date</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${new Date(booking.bookingDate).toLocaleDateString()}</td></tr>
        <tr><td style="padding:8px;color:#555;">Time</td>
            <td style="padding:8px;">${booking.bookingTime}</td></tr>
      </table>
      <p>Our team will prepare everything for your session. See you soon!</p>
    `),
  );

export const sendBookingReminderEmail = (
  email: string,
  booking: any,
  userName = 'Customer',
) =>
  sendEmail(
    email,
    `Reminder: Your booking is tomorrow – ${booking.referenceNumber}`,
    baseTemplate(`
      <h2 style="color:#e65100;">⏰ Booking Reminder</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>This is a friendly reminder about your upcoming booking <strong>tomorrow</strong>:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">Reference</td>
            <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${booking.referenceNumber}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">Service</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${booking.service?.name ?? 'Professional Service'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">Date</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${new Date(booking.bookingDate).toLocaleDateString()}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555;">Time</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${booking.bookingTime}</td></tr>
        <tr><td style="padding:8px;color:#555;">Duration</td>
            <td style="padding:8px;">${booking.duration} hour(s)</td></tr>
      </table>
      <p>Need to reschedule? Please contact us as soon as possible.</p>
    `),
  );

export const sendWelcomeEmail = (email: string, userName: string) =>
  sendEmail(
    email,
    'Welcome to Panda Studio!',
    baseTemplate(`
      <h2 style="color:#6a1b9a;">🎉 Welcome to Panda Studio!</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Your account has been created successfully. You can now:</p>
      <ul>
        <li>Book studio sessions and services</li>
        <li>Rent professional equipment</li>
        <li>Hire creative crew members</li>
        <li>Track your projects and deliverables</li>
      </ul>
      <p>We're excited to work with you!</p>
    `),
  );

export const sendAccountApprovedEmail = (email: string, userName: string) =>
  sendEmail(
    email,
    'Your Panda Studio account has been approved!',
    baseTemplate(`
      <h2 style="color:#2e7d32;">✅ Account Approved!</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Great news! Your account has been reviewed and approved by our team.</p>
      <p>You can now log in and start accepting jobs on the platform.</p>
    `),
  );
