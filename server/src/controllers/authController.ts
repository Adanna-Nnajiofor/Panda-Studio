import type { Request, Response } from "express";
import User, { type UserDocument } from "../models/User";
import type { AuthenticatedRequest, UserRole } from "../types/auth";
import { generateToken } from "../utils/jwt";
import {
  isPrivilegedRole,
  normalizeUserRole,
  serializeUser,
} from "../utils/user";

const buildAuthPayload = (user: UserDocument) => {
  const serializedUser = serializeUser(user.toObject());

  return {
    success: true as const,
    token: generateToken({
      id: serializedUser.id,
      role: serializedUser.role,
    }),
    user: serializedUser,
  };
};

const isTeamRole = (role: UserRole): boolean =>
  role === "crew" || role === "staff";

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
      role: requestedRole,
      phone,
      avatar,
      department,
      position,
      bio,
    } = req.body as {
      fullName?: string;
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      phone?: string;
      avatar?: string;
      department?: string;
      position?: string;
      bio?: string;
    };

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

    if (requestedRole === "admin" || requestedRole === "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be self-created",
      });
    }

    const role: UserRole =
      requestedRole && normalizeUserRole(requestedRole) !== "client"
        ? normalizeUserRole(requestedRole)
        : "client";

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
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
      isApproved: role === "client",
      isActive: true,
      approvalStatus: role === "client" ? "approved" : "pending",
      availability: "offline",
      assignedProjects: [],
    });

    const payload = buildAuthPayload(user);

    return res.status(201).json({
      ...payload,
      message:
        role === "client"
          ? "Account created successfully"
          : "Account created and pending approval",
      requiresApproval: role !== "client",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

export const login = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: String(email).trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await user.comparePassword(String(password));

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    const serialized = serializeUser(user.toObject());

    if (
      serialized.role !== "client" &&
      serialized.approvalStatus !== "approved" &&
      !isPrivilegedRole(serialized.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Your account is awaiting approval",
      });
    }

    return res.status(200).json(buildAuthPayload(user));
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Login failed",
    });
  }
};

export const me = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = (req as AuthenticatedRequest).user;

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const user = await User.findById(authUser.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: serializeUser(user.toObject()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch profile",
    });
  }
};

export const logout = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const refreshAuth = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  const authUser = (req as AuthenticatedRequest).user;

  if (!authUser) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }

  const user = await User.findById(authUser.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return res.status(200).json(buildAuthPayload(user));
};

export const createStaffUser = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const requester = (req as AuthenticatedRequest).user;

    if (!requester || !isPrivilegedRole(requester.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
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
    } = req.body as {
      fullName?: string;
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      phone?: string;
      avatar?: string;
      department?: string;
      position?: string;
      bio?: string;
    };

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
      requestedRole === "crew" || requestedRole === "staff"
        ? requestedRole
        : "staff";

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
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
      isApproved: false,
      isActive: true,
      approvalStatus: "pending",
      availability: "offline",
      assignedProjects: [],
    });

    return res.status(201).json({
      success: true,
      message: "Team account created",
      requiresApproval: true,
      user: serializeUser(user.toObject()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create user",
    });
  }
};

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

export default {
  register,
  login,
  me,
  logout,
  refreshAuth,
};
