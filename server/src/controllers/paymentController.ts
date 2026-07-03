import { z } from "zod";
import type { Response } from "express";
import Payment from "../models/Payment";
import Booking from "../models/Booking";
import { AuthRequest } from "../types/auth";
import {
  initializePaystackPayment,
  initializeFlutterwavePayment,
  verifyPaystackPayment,
  verifyFlutterwavePayment,
  refundPaystackPayment,
  generatePaymentReference,
} from "../services/paymentService";
import { sendNotification } from "../services/notificationService";
import { createNotification } from "../utils/notifications";
import logger from "../utils/logger";
import { generateInvoiceForBooking } from "./invoiceController";

// Validation schemas
const initializePaymentSchema = z.object({
  bookingId: z.string().nonempty(),
  paymentMethod: z.enum(["paystack", "flutterwave", "stripe"]),
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
    if (paymentMethod === "paystack" || paymentMethod === "flutterwave") {
      const userEmail =
        (booking.user &&
        typeof booking.user === "object" &&
        "email" in booking.user
          ? (booking.user as { email?: string }).email
          : undefined) ||
        req.user?.email ||
        "customer@example.com";

      const paymentMetadata = {
        bookingId,
        bookingReference: booking.referenceNumber,
        serviceName:
          booking.service &&
          typeof booking.service === "object" &&
          "name" in booking.service
            ? (booking.service as { name?: string }).name
            : "Service",
      };

      const initResult =
        paymentMethod === "paystack"
          ? await initializePaystackPayment(
              userEmail,
              booking.totalAmount,
              paymentReference,
              paymentMetadata,
            )
          : await initializeFlutterwavePayment(
              userEmail,
              booking.totalAmount,
              paymentReference,
              paymentMetadata,
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
        paymentMethod,
        status: "pending",
        reference: paymentReference,
      });

      return res.status(200).json({
        success: true,
        authorizationUrl: initResult.authorizationUrl,
        accessCode:
          "accessCode" in initResult ? initResult.accessCode : undefined,
        reference: paymentReference,
        email: userEmail,
        publicKey:
          paymentMethod === "paystack"
            ? process.env.PAYSTACK_PUBLIC_KEY ||
              process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
              ""
            : "",
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
    logger.error("initializePayment error", { error });
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
    const payment = await Payment.findOne({ reference }).populate("booking");
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Idempotency: if we've already completed this payment, don't re-run side-effects.
    if (payment.status === "completed") {
      const booking = await Booking.findById(payment.booking).populate(
        "service",
      );
      if (booking && booking.paymentStatus !== "paid") {
        booking.paymentStatus = "paid";
        await booking.save();
      }

      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        payment,
        booking,
      });
    }

    // Verify with payment provider used for this payment record
    const verifyResult =
      payment.paymentMethod === "flutterwave"
        ? await verifyFlutterwavePayment(reference)
        : payment.paymentMethod === "paystack"
          ? await verifyPaystackPayment(reference)
          : {
              success: false,
              error:
                "Verification for this payment method is not supported yet",
            };

    if (!verifyResult.success) {
      payment.status = "failed";
      payment.failureReason = "Payment verification failed";
      await payment.save();
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Security / correctness: ensure bookingId matches the payment's booking.
    const paymentBookingId =
      payment.booking && typeof payment.booking === "object"
        ? ((payment.booking as any)._id?.toString?.() ??
          String(payment.booking))
        : String(payment.booking);

    if (paymentBookingId !== bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId does not match payment booking",
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

    // Additive: generate invoice on successful payment verification
    // (invoice generation is best-effort; it must not break payment verification)
    try {
      if (booking) {
        await generateInvoiceForBooking({
          bookingId: String(booking._id),
          paymentId: payment._id ? String(payment._id) : undefined,
        });
      }
    } catch (e) {
      logger.error("invoice generation failed", { error: e });
    }

    if (booking) {
      // Send confirmation email
      try {
        await sendNotification({
          type: "payment_success",
          email: req.user?.email || "",
          booking: booking,
          amount: payment.amount,
        });
        await createNotification({
          userId: String(req.user!.id),
          type: "payment",
          title: "Payment Successful",
          message: `Payment of ₦${payment.amount.toLocaleString()} confirmed for booking ${booking?.referenceNumber ?? ""}.`,
          link: "/invoices",
        });
      } catch (notificationError) {
        logger.error("Payment notification error", {
          error: notificationError,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: payment,
      booking: booking,
    });
  } catch (error) {
    logger.error("verifyPayment error", { error });
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
    logger.error("getPaymentById error", { error });
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
    logger.error("getBookingPayments error", { error });
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
    logger.error("refundPayment error", { error });
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
    logger.error("getAllPayments error", { error });
    res.status(500).json({ message: "Server error" });
  }
};
