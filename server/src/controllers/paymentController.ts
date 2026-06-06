import { z } from "zod";
import type { Response } from "express";
import Payment from "../models/Payment";
import Booking from "../models/Booking";
import { AuthRequest } from "../types/auth";
import {
  initializePaystackPayment,
  verifyPaystackPayment,
  refundPaystackPayment,
  generatePaymentReference,
} from "../services/paymentService";
import { sendNotification } from "../services/notificationService";
import logger from "../utils/logger";

// Validation schemas
const initializePaymentSchema = z.object({
  bookingId: z.string().nonempty(),
  paymentMethod: z.enum(["paystack", "stripe"]),
});

const verifyPaymentSchema = z.object({
  reference: z.string().nonempty(),
  bookingId: z.string().nonempty(),
});

// ================= INITIALIZE PAYMENT =================
export const initializePayment = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = initializePaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      const formattedErrors = parsed.error.flatten();
      return res.status(400).json({
        message: "Invalid input",
        errors: formattedErrors.fieldErrors,
      });
    }

    const { bookingId, paymentMethod } = parsed.data;

    // Verify booking exists and belongs to user
    const booking = await Booking.findById(bookingId)
      .populate({ path: "service", select: "name" })
      .populate("user", "email");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      booking.user.toString() !== req.user!.id &&
      req.user!.role === "client"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if booking is already paid
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ message: "Booking is already paid" });
    }

    const paymentReference = generatePaymentReference();

    // Initialize payment based on method
    if (paymentMethod === "paystack") {
      const userEmail =
        (booking.user &&
        typeof booking.user === "object" &&
        "email" in booking.user
          ? (booking.user as { email?: string }).email
          : undefined) ||
        req.user?.email ||
        "customer@example.com";

      const initResult = await initializePaystackPayment(
        userEmail,
        booking.totalAmount,
        paymentReference,
        {
          bookingId,
          bookingReference: booking.referenceNumber,
          serviceName:
            booking.service &&
            typeof booking.service === "object" &&
            "name" in booking.service
              ? (booking.service as { name?: string }).name
              : "Service",
        },
      );

      if (!initResult.success) {
        return res.status(400).json({
          message: initResult.error,
        });
      }

      // Create payment record
      const payment = await Payment.create({
        booking: bookingId,
        user: req.user!.id,
        amount: booking.totalAmount,
        currency: "NGN",
        paymentMethod: "paystack",
        status: "pending",
        reference: paymentReference,
      });

      return res.status(200).json({
        success: true,
        authorizationUrl: initResult.authorizationUrl,
        accessCode: initResult.accessCode,
        reference: paymentReference,
        email: userEmail,
        publicKey:
          process.env.PAYSTACK_PUBLIC_KEY ||
          process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
          "",
        payment: payment,
      });
    }

    // Stripe would be handled on client-side
    if (paymentMethod === "stripe") {
      const payment = await Payment.create({
        booking: bookingId,
        user: req.user!.id,
        amount: booking.totalAmount,
        currency: "USD",
        paymentMethod: "stripe",
        status: "pending",
        reference: paymentReference,
      });

      return res.status(200).json({
        success: true,
        message: "Use Stripe on client side",
        reference: paymentReference,
        payment,
      });
    }
  } catch (error) {
    logger.error('initializePayment error', { error });
    res.status(500).json({ message: "Server error" });
  }
};

// ================= VERIFY PAYMENT =================
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = verifyPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      const formattedErrors = parsed.error.flatten();
      return res.status(400).json({
        message: "Invalid input",
        errors: formattedErrors.fieldErrors,
      });
    }

    const { reference, bookingId } = parsed.data;

    // Get payment record
    const payment = await Payment.findOne({ reference });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Verify with Paystack
    const verifyResult = await verifyPaystackPayment(reference);

    if (!verifyResult.success) {
      payment.status = "failed";
      payment.failureReason = "Payment verification failed";
      await payment.save();
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Update payment status
    payment.status = "completed";
    payment.transactionId = String(verifyResult.transactionId);
    payment.paidAt = new Date();
    payment.paymentGatewayResponse = verifyResult.gatewayResponse;
    await payment.save();

    // Update booking payment status
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentStatus: "paid" },
      { new: true },
    ).populate("service");

    if (booking) {
      // Send confirmation email
      try {
        await sendNotification({
          type: "payment_success",
          email: req.user?.email || "",
          booking: booking,
          amount: payment.amount,
        });
      } catch (notificationError) {
        logger.error('Payment notification error', { error: notificationError });
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: payment,
      booking: booking,
    });
  } catch (error) {
    logger.error('verifyPayment error', { error });
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET PAYMENT BY ID =================
export const getPaymentById = async (req: AuthRequest, res: Response) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("booking")
      .populate("user", "name email");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Verify access
    if (
      payment.user._id.toString() !== req.user!.id &&
      req.user!.role === "client"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json({ payment });
  } catch (error) {
    logger.error('getPaymentById error', { error });
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET BOOKING PAYMENTS =================
export const getBookingPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;

    const payments = await Payment.find({ booking: bookingId })
      .populate("booking")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ payments });
  } catch (error) {
    logger.error('getBookingPayments error', { error });
    res.status(500).json({ message: "Server error" });
  }
};

// ================= REFUND PAYMENT =================
const refundSchema = z.object({
  paymentId: z.string().nonempty(),
  reason: z.string().optional(),
});

export const refundPayment = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = refundSchema.safeParse(req.body);

    if (!parsed.success) {
      const formattedErrors = parsed.error.flatten();
      return res.status(400).json({
        message: "Invalid input",
        errors: formattedErrors.fieldErrors,
      });
    }

    // Only admins can refund
    if (!["admin", "super_admin"].includes(req.user!.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { paymentId, reason } = parsed.data;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Only completed payments can be refunded" });
    }

    // Process refund with payment gateway
    if (payment.paymentMethod === "paystack" && payment.transactionId) {
      const refundResult = await refundPaystackPayment(
        Number(payment.transactionId),
      );

      if (!refundResult.success) {
        return res.status(400).json({
          message: refundResult.error,
        });
      }
    }

    // Update payment status
    payment.status = "refunded";
    payment.refundedAt = new Date();
    await payment.save();

    // Update booking
    const booking = await Booking.findByIdAndUpdate(
      payment.booking,
      { paymentStatus: "refunded" },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Payment refunded successfully",
      payment,
      booking,
    });
  } catch (error) {
    logger.error('refundPayment error', { error });
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL PAYMENTS (ADMIN) =================
export const getAllPayments = async (req: AuthRequest, res: Response) => {
  try {
    if (!["admin", "super_admin"].includes(req.user!.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(String(startDate)),
        $lte: new Date(String(endDate)),
      };
    }

    const payments = await Payment.find(filter)
      .populate("booking", "referenceNumber totalAmount")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('getAllPayments error', { error });
    res.status(500).json({ message: "Server error" });
  }
};
