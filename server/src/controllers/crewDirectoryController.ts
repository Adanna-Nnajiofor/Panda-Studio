import type { Request, Response } from "express";
import User from "../models/User";
import type { AuthenticatedRequest } from "../types/auth";
import { serializeUser } from "../utils/user";

const findCrewDirectory = async (includeEmail: boolean) => {
  const selection = includeEmail
    ? "fullName email role department position bio availability avatar"
    : "fullName role department position bio availability avatar";

  const crew = await User.find({
    role: "crew",
    isActive: true,
    approvalStatus: "approved",
  })
    .select(selection)
    .sort({ fullName: 1 });

  return crew.map((user) => serializeUser(user.toObject()));
};

export const listCrewDirectory = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    const users = await findCrewDirectory(true);

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to load crew directory",
    });
  }
};

export const listPublicCrewDirectory = async (
  _req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const users = await findCrewDirectory(false);
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to load crew directory",
    });
  }
};
