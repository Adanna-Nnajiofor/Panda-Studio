import type { Request, Response } from "express";
import crypto from "crypto";
import AuthSession from "../models/AuthSession";
import LoginHistory from "../models/LoginHistory";
import User, { type UserDocument } from "../models/User";
import type { AuthenticatedRequest, UserRole } from "../types/auth";
import { generateToken } from "../utils/jwt";
import { isPrivilegedRole, serializeUser } from "../utils/user";
import {
  buildOtpAuthUrl,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  verifyTotpCode,
} from "../utils/totp";
import {
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
} from "../services/emailService";

const buildAuthPayload = (user: UserDocument, sessionId?: string) => {
  const serializedUser = serializeUser(user.toObject());
  return {
    success: true as const,
    token: generateToken({
      id: serializedUser.id,
      role: serializedUser.role,
      sid: sessionId,
    }),
    sessionId,
    user: serializedUser,
  };
};

const clientOrigin = (): string =>
  (process.env.CLIENT_ORIGIN ?? "http://localhost:3000")
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");

const getRequestIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedValue =
    typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "";
  return forwardedValue || req.ip || "unknown";
};

const getDeviceName = (userAgent: string | undefined): string => {
  if (!userAgent) return "Unknown device";
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("android")) return "Android device";
  if (ua.includes("windows")) return "Windows device";
  if (ua.includes("mac os")) return "Mac device";
  if (ua.includes("linux")) return "Linux device";
  return "Browser session";
};

const logLoginAttempt = async ({
  userId,
  email,
  success,
  req,
  failureReason,
  sessionId,
}: {
  userId?: string;
  email: string;
  success: boolean;
  req: Request;
  failureReason?: string;
  sessionId?: string;
}) => {
  await LoginHistory.create({
    user: userId,
    email,
    success,
    ipAddress: getRequestIp(req),
    userAgent: req.headers["user-agent"]?.toString(),
    deviceName: getDeviceName(req.headers["user-agent"]?.toString()),
    failureReason,
    sessionId,
  }).catch(() => null);
};

const createSessionForUser = async (userId: string, req: Request) => {
  const sessionId = crypto.randomUUID();
  await AuthSession.create({
    user: userId,
    sessionId,
    ipAddress: getRequestIp(req),
    userAgent: req.headers["user-agent"]?.toString(),
    deviceName: getDeviceName(req.headers["user-agent"]?.toString()),
    lastSeenAt: new Date(),
  });
  return sessionId;
};

// ─── Register ────────────────────────────────────────────────────────────────
export const register = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const {
      fullName,
      name,
      email,
      password,
      phone,
      avatar,
      department,
      position,
      bio,
    } = req.body as Record<string, string | undefined>;

    const displayName = String(fullName || name || "").trim();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!displayName || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and password are required",
      });
    }

    if (await User.findOne({ email: normalizedEmail })) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      fullName: displayName,
      email: normalizedEmail,
      password,
      role: "client" as UserRole,
      phone,
      avatar,
      department,
      position,
      bio,
      isApproved: true,
      isActive: true,
      approvalStatus: "approved",
      availability: "offline",
      assignedProjects: [],
      emailVerified: false,
      emailVerifyToken: verifyToken,
      emailVerifyExpires: verifyExpires,
    });

    const verifyUrl = `${clientOrigin()}/verify-email?token=${verifyToken}`;
    sendEmailVerificationEmail(normalizedEmail, displayName, verifyUrl).catch(
      () => null,
    );

    const sessionId = await createSessionForUser(String(user._id), req);
    await logLoginAttempt({
      userId: String(user._id),
      email: normalizedEmail,
      success: true,
      req,
      sessionId,
    });

    return res.status(201).json({
      ...buildAuthPayload(user, sessionId),
      message: "Account created successfully. Please verify your email.",
      requiresApproval: false,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
export const login = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { email, password, twoFactorCode, backupCode } = req.body as {
      email?: string;
      password?: string;
      twoFactorCode?: string;
      backupCode?: string;
    };

    const normalizedEmail = String(email ?? "")
      .trim()
      .toLowerCase();

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password +twoFactorSecret +twoFactorBackupCodes");

    if (!user) {
      await logLoginAttempt({
        email: normalizedEmail,
        success: false,
        req,
        failureReason: "user_not_found",
      });
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (!(await user.comparePassword(String(password)))) {
      await logLoginAttempt({
        userId: String(user._id),
        email: normalizedEmail,
        success: false,
        req,
        failureReason: "invalid_password",
      });
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      await logLoginAttempt({
        userId: String(user._id),
        email: normalizedEmail,
        success: false,
        req,
        failureReason: "inactive_account",
      });
      return res
        .status(403)
        .json({ success: false, message: "Account is inactive" });
    }

    const serialized = serializeUser(user.toObject());
    if (
      serialized.role !== "client" &&
      serialized.approvalStatus !== "approved" &&
      !isPrivilegedRole(serialized.role)
    ) {
      await logLoginAttempt({
        userId: String(user._id),
        email: normalizedEmail,
        success: false,
        req,
        failureReason: "awaiting_approval",
      });
      return res
        .status(403)
        .json({ success: false, message: "Your account is awaiting approval" });
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const providedTotp = String(twoFactorCode ?? "").trim();
      const providedBackupCode = String(backupCode ?? "").trim();

      if (!providedTotp && !providedBackupCode) {
        return res.status(200).json({
          success: false,
          requiresTwoFactor: true,
          message: "Two-factor code is required",
        });
      }

      let validSecondFactor = false;

      if (providedTotp) {
        validSecondFactor = verifyTotpCode(user.twoFactorSecret, providedTotp);
      }

      if (!validSecondFactor && providedBackupCode) {
        const backupHash = hashBackupCode(providedBackupCode);
        const existingCodes = user.twoFactorBackupCodes ?? [];
        const index = existingCodes.indexOf(backupHash);
        if (index >= 0) {
          existingCodes.splice(index, 1);
          user.twoFactorBackupCodes = existingCodes;
          validSecondFactor = true;
          await user.save();
        }
      }

      if (!validSecondFactor) {
        await logLoginAttempt({
          userId: String(user._id),
          email: normalizedEmail,
          success: false,
          req,
          failureReason: "invalid_2fa_code",
        });
        return res
          .status(401)
          .json({ success: false, message: "Invalid two-factor code" });
      }
    }

    const sessionId = await createSessionForUser(String(user._id), req);
    await logLoginAttempt({
      userId: String(user._id),
      email: normalizedEmail,
      success: true,
      req,
      sessionId,
    });

    return res.status(200).json(buildAuthPayload(user, sessionId));
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Login failed",
    });
  }
};

// ─── Me ──────────────────────────────────────────────────────────────────────
export const me = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const user = await User.findById(authUser.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return res
      .status(200)
      .json({ success: true, user: serializeUser(user.toObject()) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch profile",
    });
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logout = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const authReq = req as AuthenticatedRequest;
  const sid = authReq.tokenPayload?.sid;

  if (sid) {
    await AuthSession.updateOne(
      { sessionId: sid, user: authReq.user?.id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: "logout" } },
    ).catch(() => null);
  }

  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

// ─── Refresh ─────────────────────────────────────────────────────────────────
export const refreshAuth = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  const authUser = (req as AuthenticatedRequest).user;
  if (!authUser)
    return res.status(401).json({ success: false, message: "Not authorized" });

  const user = await User.findById(authUser.id);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });

  const sid = (req as AuthenticatedRequest).tokenPayload?.sid;

  if (sid) {
    const updated = await AuthSession.findOneAndUpdate(
      { sessionId: sid, user: authUser.id, revokedAt: null },
      { $set: { lastSeenAt: new Date() } },
      { new: true },
    ).select("sessionId");

    if (!updated) {
      return res
        .status(401)
        .json({ success: false, message: "Session expired or revoked" });
    }
  }

  return res.status(200).json(buildAuthPayload(user, sid));
};

export const setupTwoFactor = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const user = await User.findById(authUser.id).select(
      "+twoFactorTempSecret +twoFactorBackupCodes +twoFactorSecret",
    );

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Two-factor authentication is already enabled",
        });
    }

    const secret = generateTotpSecret();
    const backupCodes = generateBackupCodes();
    user.twoFactorTempSecret = secret;
    user.twoFactorBackupCodes = backupCodes.map(hashBackupCode);
    await user.save();

    const otpauthUrl = buildOtpAuthUrl({
      issuer: "Panda Studio",
      accountName: authUser.email,
      secret,
    });

    return res.status(200).json({
      success: true,
      secret,
      otpauthUrl,
      backupCodes,
      message: "Scan secret in your authenticator app and confirm with a code",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to set up 2FA",
    });
  }
};

export const enableTwoFactor = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const { code } = req.body as { code?: string };
    if (!code) {
      return res
        .status(400)
        .json({ success: false, message: "Verification code is required" });
    }

    const user = await User.findById(authUser.id).select(
      "+twoFactorTempSecret +twoFactorSecret",
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (!user.twoFactorTempSecret) {
      return res.status(400).json({
        success: false,
        message: "Two-factor setup has not been initiated",
      });
    }

    const valid = verifyTotpCode(user.twoFactorTempSecret, String(code));
    if (!valid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
    }

    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = null;
    user.twoFactorEnabled = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Two-factor authentication enabled successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to enable 2FA",
    });
  }
};

export const disableTwoFactor = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const { code } = req.body as { code?: string };
    if (!code) {
      return res
        .status(400)
        .json({ success: false, message: "Verification code is required" });
    }

    const user = await User.findById(authUser.id).select(
      "+twoFactorSecret +twoFactorBackupCodes",
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: "Two-factor authentication is not enabled",
      });
    }

    const valid = verifyTotpCode(user.twoFactorSecret, String(code));
    if (!valid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorTempSecret = null;
    user.twoFactorBackupCodes = [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Two-factor authentication disabled successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to disable 2FA",
    });
  }
};

export const getMySessions = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const currentSid = (req as AuthenticatedRequest).tokenPayload?.sid;
    const sessions = await AuthSession.find({
      user: authUser.id,
      revokedAt: null,
    })
      .sort({ updatedAt: -1 })
      .select("sessionId ipAddress userAgent deviceName lastSeenAt createdAt");

    return res.status(200).json({
      success: true,
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        deviceName: session.deviceName,
        lastSeenAt: session.lastSeenAt,
        createdAt: session.createdAt,
        isCurrent: session.sessionId === currentSid,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch sessions",
    });
  }
};

export const revokeSession = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const { sessionId } = req.params as { sessionId?: string };
    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "sessionId is required" });
    }

    const updated = await AuthSession.findOneAndUpdate(
      { user: authUser.id, sessionId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: "user_revoked" } },
      { new: true },
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    return res.status(200).json({ success: true, message: "Session revoked" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to revoke session",
    });
  }
};

export const revokeOtherSessions = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const currentSid = (req as AuthenticatedRequest).tokenPayload?.sid;
    if (!currentSid) {
      return res.status(400).json({
        success: false,
        message: "Current session is missing. Please log in again.",
      });
    }

    const result = await AuthSession.updateMany(
      { user: authUser.id, revokedAt: null, sessionId: { $ne: currentSid } },
      {
        $set: { revokedAt: new Date(), revokedReason: "revoke_other_sessions" },
      },
    );

    return res.status(200).json({
      success: true,
      revokedCount: result.modifiedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to revoke other sessions",
    });
  }
};

export const getLoginHistory = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const limitRaw = Number((req.query.limit as string | undefined) ?? 20);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 20;

    const history = await LoginHistory.find({ user: authUser.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        "email success ipAddress userAgent deviceName failureReason sessionId createdAt",
      );

    return res.status(200).json({ success: true, history });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch login history",
    });
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const verifyEmail = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { token } = req.body as { token?: string };
    if (!token)
      return res
        .status(400)
        .json({ success: false, message: "Token is required" });

    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpires: { $gt: new Date() },
    }).select("+emailVerifyToken +emailVerifyExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    user.emailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpires = null;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Verification failed",
    });
  }
};

// ─── Resend Verification ──────────────────────────────────────────────────────
export const resendVerification = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { email } = req.body as { email?: string };
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    const user = await User.findOne({
      email: String(email).trim().toLowerCase(),
    }).select("+emailVerifyToken +emailVerifyExpires");

    // Always return 200 to prevent email enumeration
    if (!user || user.emailVerified) {
      return res.status(200).json({
        success: true,
        message:
          "If that email exists and is unverified, a link has been sent.",
      });
    }

    const verifyToken = crypto.randomBytes(32).toString("hex");
    user.emailVerifyToken = verifyToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verifyUrl = `${clientOrigin()}/verify-email?token=${verifyToken}`;
    sendEmailVerificationEmail(user.email, user.fullName, verifyUrl).catch(
      () => null,
    );

    return res.status(200).json({
      success: true,
      message: "If that email exists and is unverified, a link has been sent.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to resend",
    });
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { email } = req.body as { email?: string };
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    const user = await User.findOne({
      email: String(email).trim().toLowerCase(),
    }).select("+passwordResetToken +passwordResetExpires");

    // Always 200 to prevent enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email is registered, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${clientOrigin()}/reset-password?token=${resetToken}`;
    sendPasswordResetEmail(user.email, user.fullName, resetUrl).catch(
      () => null,
    );

    return res.status(200).json({
      success: true,
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to process request",
    });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { token, password } = req.body as {
      token?: string;
      password?: string;
    };

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordResetToken +passwordResetExpires");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset link" });
    }

    user.password = String(password);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Reset failed",
    });
  }
};

// ─── Change Password (authenticated) ─────────────────────────────────────────
export const changePassword = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(authUser.id).select("+password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const valid = await user.comparePassword(String(currentPassword));
    if (!valid)
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });

    user.password = String(newPassword);
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to change password",
    });
  }
};

// ─── Create Staff User (admin) ────────────────────────────────────────────────
export const createStaffUser = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const requester = (req as AuthenticatedRequest).user;
    if (!requester || !isPrivilegedRole(requester.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }

    const {
      fullName,
      name,
      email,
      password,
      role: requestedRole,
      phone,
      avatar,
      department,
      position,
      bio,
    } = req.body as Record<string, string | undefined>;

    const displayName = String(fullName || name || "").trim();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!displayName || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and password are required",
      });
    }

    const role: UserRole =
      requestedRole === "admin" && requester.role === "super_admin"
        ? "admin"
        : "staff";

    if (await User.findOne({ email: normalizedEmail })) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    const user = await User.create({
      fullName: displayName,
      email: normalizedEmail,
      password,
      role,
      phone,
      avatar,
      department,
      position,
      bio,
      isApproved: true,
      isActive: true,
      approvalStatus: "approved",
      emailVerified: true,
      availability: "offline",
      assignedProjects: [],
    });

    return res.status(201).json({
      success: true,
      message: "Team account created",
      requiresApproval: false,
      user: serializeUser(user.toObject()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create user",
    });
  }
};

// ─── Aliases ──────────────────────────────────────────────────────────────────
export const registerUser = register;
export const signup = register;
export const signUp = register;
export const loginUser = login;
export const signIn = login;
export const getMe = me;
export const currentUser = me;
export const profile = me;
export const logoutUser = logout;
export const refresh = refreshAuth;
export const createUser = createStaffUser;

export default { register, login, me, logout, refreshAuth };
