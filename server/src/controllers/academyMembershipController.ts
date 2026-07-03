import { z } from "zod";
import type { Request, Response } from "express";
import MembershipPlan from "../models/MembershipPlan";
import AcademySubscription from "../models/AcademySubscription";
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
  planId: z.string().nonempty(),
  paymentMethod: z.enum(["paystack", "flutterwave"]),
});

const verifySchema = z.object({
  reference: z.string().nonempty(),
});

const createPlanSchema = z.object({
  code: z.string().nonempty(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().default("NGN"),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
});

function computeExpiry(interval: "monthly" | "yearly", now = new Date()) {
  const expiresAt = new Date(now);
  if (interval === "yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }
  return expiresAt;
}

export const listMembershipPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await MembershipPlan.find({
      isActive: true,
      isPublic: true,
    }).sort({ price: 1 });
    return res.status(200).json({ success: true, count: plans.length, plans });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch membership plans",
    });
  }
};

export const listMembershipPlansAdmin = async (
  _req: Request,
  res: Response,
) => {
  try {
    const plans = await MembershipPlan.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: plans.length, plans });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch membership plans",
    });
  }
};

export const createMembershipPlan = async (req: Request, res: Response) => {
  try {
    const parsed = createPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const payload = parsed.data;
    const plan = await MembershipPlan.create({
      ...payload,
      code: payload.code.toUpperCase(),
      currency: payload.currency.toUpperCase(),
    });

    return res.status(201).json({ success: true, plan });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create membership plan",
    });
  }
};

export const updateMembershipPlan = async (req: Request, res: Response) => {
  try {
    const updates = { ...req.body } as Record<string, unknown>;
    if (typeof updates.code === "string")
      updates.code = updates.code.toUpperCase();
    if (typeof updates.currency === "string")
      updates.currency = updates.currency.toUpperCase();

    const plan = await MembershipPlan.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    }
    return res.status(200).json({ success: true, plan });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update membership plan",
    });
  }
};

export const initializeMembershipPayment = async (
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

    const { planId, paymentMethod } = parsed.data;

    const plan = await MembershipPlan.findById(planId).select(
      "_id code name price currency interval isActive isPublic",
    );
    if (!plan || !plan.isActive || !plan.isPublic) {
      return res
        .status(404)
        .json({ success: false, message: "Membership plan not found" });
    }

    const reference = `AMS-${generatePaymentReference()}`;
    const clientOrigin = (
      process.env.CLIENT_ORIGIN ?? "http://localhost:3000"
    ).replace(/\/$/, "");
    const returnUrl = `${clientOrigin}/academy/membership/verify?reference=${encodeURIComponent(reference)}`;

    const metadata = {
      paymentType: "academy_membership",
      planId: String(plan._id),
      planCode: plan.code,
      planName: plan.name,
      userId: req.user!.id,
    };

    const initResult =
      paymentMethod === "paystack"
        ? await initializePaystackPayment(
            req.user!.email,
            plan.price,
            reference,
            metadata,
            returnUrl,
          )
        : await initializeFlutterwavePayment(
            req.user!.email,
            plan.price,
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
      amount: plan.price,
      currency: plan.currency,
      paymentMethod,
      status: "pending",
      reference,
      paymentFor: "membership",
      membershipPlan: plan._id,
    });

    await AcademySubscription.create({
      user: req.user!.id,
      plan: plan._id,
      status: "pending",
      paymentReference: reference,
    });

    return res.status(200).json({
      success: true,
      reference,
      authorizationUrl: initResult.authorizationUrl,
      payment,
    });
  } catch (error) {
    logger.error("initializeMembershipPayment error", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyMembershipPayment = async (
  req: AuthRequest,
  res: Response,
) => {
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
    const payment = await AcademyPayment.findOne({ reference }).populate(
      "membershipPlan",
    );

    if (!payment || payment.paymentFor !== "membership") {
      return res
        .status(404)
        .json({ success: false, message: "Membership payment not found" });
    }

    if (String(payment.user) !== req.user!.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (payment.status === "completed") {
      const subscription = await AcademySubscription.findOneAndUpdate(
        { user: req.user!.id, paymentReference: reference },
        {
          $set: {
            status: "active",
            startedAt: new Date(),
            expiresAt: computeExpiry(
              ((payment.membershipPlan as any)?.interval as
                | "monthly"
                | "yearly") ?? "monthly",
              new Date(),
            ),
          },
        },
        { new: true },
      );
      return res
        .status(200)
        .json({
          success: true,
          message: "Membership already active",
          payment,
          subscription,
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
      await AcademySubscription.findOneAndUpdate(
        { user: req.user!.id, paymentReference: reference },
        { $set: { status: "cancelled" } },
      );
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    payment.status = "completed";
    payment.transactionId = String(verifyResult.transactionId ?? "");
    payment.paidAt = new Date();
    payment.paymentGatewayResponse = verifyResult.gatewayResponse;
    await payment.save();

    const interval =
      ((payment.membershipPlan as any)?.interval as "monthly" | "yearly") ??
      "monthly";

    const subscription = await AcademySubscription.findOneAndUpdate(
      { user: req.user!.id, paymentReference: reference },
      {
        $set: {
          status: "active",
          startedAt: new Date(),
          expiresAt: computeExpiry(interval, new Date()),
        },
      },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Membership payment verified successfully",
      payment,
      subscription,
    });
  } catch (error) {
    logger.error("verifyMembershipPayment error", { error });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyMembership = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const subscription = await AcademySubscription.findOne({
      user: req.user!.id,
      status: "active",
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
    })
      .populate("plan")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, subscription });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch membership",
    });
  }
};
