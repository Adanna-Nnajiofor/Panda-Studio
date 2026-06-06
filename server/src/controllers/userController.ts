import type { Request, Response } from "express";
import User from "../models/User";
import type {
  AuthenticatedRequest,
  CrewAvailability,
  UserRole,
} from "../types/auth";
import {
  canManageUsers,
  isPrivilegedRole,
  isValidUserRole,
  serializeUser,
} from "../utils/user";

const PUBLIC_USER_FIELDS =
  "fullName email role isApproved isActive approvalStatus availability phone avatar department position bio isVerified approvedBy approvedAt assignedProjects createdAt updatedAt";

const sendNotFound = (res: Response) =>
  res.status(404).json({
    success: false,
    message: "User not found",
  });

const isAvailabilityValue = (value: unknown): value is CrewAvailability =>
  value === "available" ||
  value === "busy" ||
  value === "on_project" ||
  value === "offline";

const canAccessUser = (
  requesterId: string,
  requesterRole: UserRole,
  targetUserId: string,
) => {
  return requesterId === targetUserId || isPrivilegedRole(requesterRole);
};

const getAuthUser = (
  req: Request,
): NonNullable<AuthenticatedRequest["user"]> | undefined => {
  return (req as AuthenticatedRequest).user;
};

const getParamId = (req: Request): string => {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
};

export const getProfile = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const dbUser = await User.findById(user.id).select(PUBLIC_USER_FIELDS);

    if (!dbUser) {
      return sendNotFound(res);
    }

    return res.status(200).json({
      success: true,
      user: serializeUser(dbUser.toObject()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch profile",
    });
  }
};

export const getMyProfile = getProfile;

export const getUsers = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || !canManageUsers(authUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const { role, isApproved, isActive, pending } = req.query as {
      role?: UserRole;
      isApproved?: string;
      isActive?: string;
      pending?: string;
    };

    const filter: Record<string, unknown> = {};

    if (role && isValidUserRole(role)) {
      filter.role = role;
    }

    if (typeof isApproved === "string") {
      filter.isApproved = isApproved === "true";
    } else if (pending === "true") {
      filter.isApproved = false;
      filter.role = { $in: ["crew", "staff"] };
    }

    if (typeof isActive === "string") {
      filter.isActive = isActive === "true";
    }

    const users = await User.find(filter)
      .select(PUBLIC_USER_FIELDS)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((user) => serializeUser(user.toObject())),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch users",
    });
  }
};

export const getPendingUsers = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || !canManageUsers(authUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const users = await User.find({
      approvalStatus: "pending",
      role: { $in: ["crew", "staff"] },
    })
      .select(PUBLIC_USER_FIELDS)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((user) => serializeUser(user.toObject())),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch pending users",
    });
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const id = getParamId(req);

    if (!canAccessUser(authUser.id, authUser.role, id)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const user = await User.findById(id).select(PUBLIC_USER_FIELDS);

    if (!user) {
      return sendNotFound(res);
    }

    return res.status(200).json({
      success: true,
      user: serializeUser(user.toObject()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch user",
    });
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const id = getParamId(req);

    if (!canAccessUser(authUser.id, authUser.role, id)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const targetUser = await User.findById(id).select("+password");

    if (!targetUser) {
      return sendNotFound(res);
    }

    const {
      fullName,
      phone,
      avatar,
      department,
      position,
      bio,
      availability,
      isActive,
      role,
      isApproved,
    } = req.body as {
      fullName?: string;
      phone?: string;
      avatar?: string;
      department?: string;
      position?: string;
      bio?: string;
      availability?: string;
      isActive?: boolean;
      role?: UserRole;
      isApproved?: boolean;
    };

    if (typeof fullName === "string") {
      targetUser.fullName = fullName.trim();
    }

    if (typeof phone === "string") {
      targetUser.phone = phone.trim();
    }

    if (typeof avatar === "string") {
      targetUser.avatar = avatar.trim();
    }

    if (typeof department === "string") {
      targetUser.department = department.trim();
    }

    if (typeof position === "string") {
      targetUser.position = position.trim();
    }

    if (typeof bio === "string") {
      targetUser.bio = bio.trim();
    }

    if (typeof availability === "string" && isAvailabilityValue(availability)) {
      targetUser.availability = availability;
    }

    if (authUser.id === id || isPrivilegedRole(authUser.role)) {
      if (typeof isActive === "boolean") {
        targetUser.isActive = isActive;
      }

      if (typeof isApproved === "boolean") {
        targetUser.isApproved = isApproved;
      }

      if (typeof role === "string" && isValidUserRole(role)) {
        if (
          (role === "admin" || role === "super_admin") &&
          authUser.role !== "super_admin"
        ) {
          return res.status(403).json({
            success: false,
            message: "Only super admins can assign admin roles",
          });
        }

        targetUser.role = role;
      }
    }

    if (targetUser.role === "crew" || targetUser.role === "staff") {
      targetUser.approvalStatus = targetUser.isApproved
        ? "approved"
        : "pending";
    }

    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: serializeUser(targetUser.toObject()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update user",
    });
  }
};

export const approveUser = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || !canManageUsers(authUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const id = getParamId(req);

    const user = await User.findById(id);

    if (!user) {
      return sendNotFound(res);
    }

    if (user.role !== "crew" && user.role !== "staff") {
      return res.status(400).json({
        success: false,
        message: "Only crew and staff accounts require approval",
      });
    }

    user.isApproved = true;
    user.isActive = true;
    user.approvalStatus = "approved";
    user.availability =
      user.availability === "offline" ? "available" : user.availability;

    user.approvedBy = authUser.id as never;
    user.approvedAt = new Date();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User approved successfully",
      user: serializeUser(user.toObject()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to approve user",
    });
  }
};

export const updateMyAvailability = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { availability } = req.body as {
      availability?: CrewAvailability;
    };

    if (
      typeof availability !== "string" ||
      !isAvailabilityValue(availability)
    ) {
      return res.status(400).json({
        success: false,
        message: "availability is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      authUser.id,
      { availability },
      { new: true, runValidators: true },
    );

    if (!user) {
      return sendNotFound(res);
    }

    return res.status(200).json({
      success: true,
      user: serializeUser(user.toObject()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update availability",
    });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  const user = getAuthUser(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }

  req.params.id = user.id;

  return updateUser(req, res);
};

export const assignProjectToUser = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || !canManageUsers(authUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const { projectId } = req.body as { projectId?: string };

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "projectId is required",
      });
    }

    const id = getParamId(req);

    const user = await User.findByIdAndUpdate(
      id,
      {
        $addToSet: { assignedProjects: projectId },
      },
      { new: true, runValidators: true },
    );

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
        error instanceof Error ? error.message : "Failed to assign project",
    });
  }
};

export const removeProjectFromUser = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || !canManageUsers(authUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const { projectId } = req.body as { projectId?: string };

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "projectId is required",
      });
    }

    const id = getParamId(req);

    const user = await User.findByIdAndUpdate(
      id,
      {
        $pull: { assignedProjects: projectId },
      },
      { new: true, runValidators: true },
    );

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
        error instanceof Error ? error.message : "Failed to remove project",
    });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || !canManageUsers(authUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const id = getParamId(req);

    if (authUser.id === id && authUser.role !== "super_admin") {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete user",
    });
  }
};

export const getUserProfile = getProfile;
export const listUsers = getUsers;
export const approveRegistration = approveUser;
export const getAllUsers = getUsers;

export default {
  getProfile,
  getUsers,
  getUserById,
  updateUser,
  approveUser,
  updateProfile,
  assignProjectToUser,
  removeProjectFromUser,
  deleteUser,
};
