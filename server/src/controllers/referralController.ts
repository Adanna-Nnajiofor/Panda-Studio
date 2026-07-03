import type { Request, Response } from "express";
import Referral from "../models/Referral";
import User from "../models/User";
import type { AuthenticatedRequest } from "../types/auth";

const getUser = (req: Request) => (req as AuthenticatedRequest).user;

const isExpired = (expiresAt?: Date) =>
  Boolean(expiresAt && new Date(expiresAt).getTime() < Date.now());

export const getMyReferrals = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = getUser(req);
    const referrals = await Referral.find({ referrer: user?.id })
      .populate("referee", "fullName email createdAt")
      .sort({ createdAt: -1 });

    const totalReferrals = referrals.length;
    const successfulReferrals = referrals.filter(
      (ref) => ref.status === "completed" || ref.rewardPaid,
    ).length;
    const totalEarnings = referrals.reduce((sum, ref) => {
      if (ref.status === "completed" || ref.rewardPaid) {
        return sum + (ref.rewardAmount ?? 0);
      }
      return sum;
    }, 0);

    res.json({
      success: true,
      count: referrals.length,
      referrals,
      totalReferrals,
      successfulReferrals,
      totalEarnings,
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch referrals" });
  }
};

export const getMyReferralCode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = getUser(req);
    let referral = await Referral.findOne({
      referrer: user?.id,
      status: "pending",
      referee: { $exists: false },
    });

    if (referral && isExpired(referral.expiresAt)) {
      referral.status = "expired";
      await referral.save();
      referral = null;
    }

    if (!referral) {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      referral = await Referral.create({ referrer: user?.id, expiresAt });
    }
    res.json({ success: true, code: referral.code, referral });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get referral code",
      });
  }
};

export const applyReferralCode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = getUser(req);
    const { code } = req.body as { code: string };
    if (!code) {
      res
        .status(400)
        .json({ success: false, message: "Referral code is required" });
      return;
    }
    const referral = await Referral.findOne({
      code: code.toUpperCase(),
      status: "pending",
    });
    if (!referral) {
      res
        .status(404)
        .json({ success: false, message: "Invalid or expired referral code" });
      return;
    }

    if (isExpired(referral.expiresAt)) {
      referral.status = "expired";
      await referral.save();
      res
        .status(400)
        .json({ success: false, message: "Referral code has expired" });
      return;
    }

    if (String(referral.referrer) === user?.id) {
      res
        .status(400)
        .json({
          success: false,
          message: "You cannot use your own referral code",
        });
      return;
    }
    const alreadyUsed = await Referral.findOne({ referee: user?.id });
    if (alreadyUsed) {
      res
        .status(400)
        .json({
          success: false,
          message: "You have already used a referral code",
        });
      return;
    }
    referral.referee = user?.id as unknown as import("mongoose").Types.ObjectId;
    referral.status = "registered";
    await referral.save();
    res.json({
      success: true,
      message: "Referral code applied successfully",
      referral,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to apply referral code",
      });
  }
};

export const lookupReferralCode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const code = String(req.params.code ?? "")
      .trim()
      .toUpperCase();
    if (!code) {
      res
        .status(400)
        .json({ success: false, message: "Referral code is required" });
      return;
    }

    const referral = await Referral.findOne({ code })
      .populate("referrer", "fullName")
      .select("code status rewardAmount currency expiresAt referrer");

    if (
      !referral ||
      referral.status !== "pending" ||
      isExpired(referral.expiresAt)
    ) {
      if (
        referral &&
        isExpired(referral.expiresAt) &&
        referral.status !== "expired"
      ) {
        referral.status = "expired";
        await referral.save();
      }
      res.status(404).json({
        success: false,
        valid: false,
        message: "Invalid or expired referral code",
      });
      return;
    }

    res.json({
      success: true,
      valid: true,
      code: referral.code,
      rewardAmount: referral.rewardAmount,
      currency: referral.currency,
      expiresAt: referral.expiresAt,
      referrerName:
        typeof referral.referrer === "object" && referral.referrer
          ? ((referral.referrer as { fullName?: string }).fullName ??
            "Panda Studio User")
          : "Panda Studio User",
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to lookup referral code" });
  }
};

export const getAllReferrals = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const referrals = await Referral.find()
      .populate("referrer", "fullName email")
      .populate("referee", "fullName email")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: referrals.length, referrals });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch referrals" });
  }
};
