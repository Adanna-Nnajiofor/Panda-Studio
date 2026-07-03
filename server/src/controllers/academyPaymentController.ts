import { z } from "zod";
import type { Response } from "express";
import Course from "../models/Course";
import Enrollment from "../models/Enrollment";
import AcademyPayment from "../models/AcademyPayment";
import type { AuthRequest } from "../types/auth";
import {
  generatePaymentReference,
  initializeFlutterwavePayment,
  initializePaystackPayment,
  verifyFlutterwavePayment,
  verifyPaystackPayment,
} from "../services/paymentService";
import logger from "../utils/logger";

const initializeSchema = z.object({
  courseId: z.string().nonempty(),
  paymentMethod: z.enum(["paystack", "flutterwave"]),
});

const verifySchema = z.object({
  reference: z.string().nonempty(),
});

export const initializeAcademyPayment = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const parsed = initializeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { courseId, paymentMethod } = parsed.data;

    const course = await Course.findById(courseId).select(
      "_id title pricingType price currency isPublished",
    );
    if (!course || !course.isPublished) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (course.pricingType !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Only paid courses require payment initialization",
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      user: req.user!.id,
      course: course._id,
    }).select("_id");

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    const reference = `ACD-${generatePaymentReference()}`;
    const clientOrigin = (
      process.env.CLIENT_ORIGIN ?? "http://localhost:3000"
    ).replace(/\/$/, "");
    const returnUrl = `${clientOrigin}/academy/payments/verify?reference=${encodeURIComponent(reference)}`;

    const metadata = {
      paymentType: "academy_course",
      courseId: String(course._id),
      courseTitle: course.title,
      userId: req.user!.id,
    };

    const initResult =
      paymentMethod === "paystack"
        ? await initializePaystackPayment(
            req.user!.email,
            course.price,
            reference,
            metadata,
            returnUrl,
          )
        : await initializeFlutterwavePayment(
            req.user!.email,
            course.price,
            reference,
            metadata,
            returnUrl,
          );

    if (!initResult.success) {
      return res
        .status(400)
        .json({ success: false, message: initResult.error });
    }

    const payment = await AcademyPayment.create({
      user: req.user!.id,
      course: course._id,
      paymentFor: "course",
      amount: course.price,
      currency: course.currency,
      paymentMethod,
      status: "pending",
      reference,
    });

    return res.status(200).json({
      success: true,
      reference,
      authorizationUrl: initResult.authorizationUrl,
      payment,
    });
  } catch (error) {
    logger.error("initializeAcademyPayment error", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyAcademyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { reference } = parsed.data;

    const payment = await AcademyPayment.findOne({ reference });
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    if (String(payment.user) !== req.user!.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (payment.status === "completed") {
      const enrollment = await Enrollment.findOneAndUpdate(
        { user: payment.user, course: payment.course },
        {
          $setOnInsert: {
            user: payment.user,
            course: payment.course,
            enrolledAt: new Date(),
          },
          $set: {
            status: "active",
            accessType: "paid",
            lastAccessedAt: new Date(),
          },
        },
        { new: true, upsert: true },
      );

      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        payment,
        enrollment,
      });
    }

    const verifyResult =
      payment.paymentMethod === "flutterwave"
        ? await verifyFlutterwavePayment(reference)
        : await verifyPaystackPayment(reference);

    if (!verifyResult.success) {
      payment.status = "failed";
      payment.failureReason = "Payment verification failed";
      await payment.save();
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    payment.status = "completed";
    payment.transactionId = String(verifyResult.transactionId ?? "");
    payment.paidAt = new Date();
    payment.paymentGatewayResponse = verifyResult.gatewayResponse;
    await payment.save();

    const enrollment = await Enrollment.findOneAndUpdate(
      { user: payment.user, course: payment.course },
      {
        $setOnInsert: {
          user: payment.user,
          course: payment.course,
          enrolledAt: new Date(),
        },
        $set: {
          status: "active",
          accessType: "paid",
          lastAccessedAt: new Date(),
        },
      },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      success: true,
      message: "Academy payment verified successfully",
      payment,
      enrollment,
    });
  } catch (error) {
    logger.error("verifyAcademyPayment error", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyAcademyPayments = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await AcademyPayment.find({ user: req.user!.id })
      .populate("course", "title slug pricingType price currency")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json({ success: true, count: payments.length, payments });
  } catch (error) {
    logger.error("getMyAcademyPayments error", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
