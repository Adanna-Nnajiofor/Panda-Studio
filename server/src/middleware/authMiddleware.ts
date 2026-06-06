import type { NextFunction, Request, RequestHandler, Response } from "express";
import User from "../models/User";
import type { AuthenticatedRequest, UserRole } from "../types/auth";
import { verifyToken } from "../utils/jwt";
import { isPrivilegedRole, serializeUser } from "../utils/user";

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const xAuthToken = req.headers["x-auth-token"];
  if (typeof xAuthToken === "string" && xAuthToken.trim().length > 0) {
    return xAuthToken.trim();
  }

  return null;
};

const sendUnauthorized = (res: Response, message = "Not authorized"): void => {
  res.status(401).json({
    success: false,
    message,
  });
};

const sendForbidden = (
  res: Response,
  message = "Insufficient permissions",
): void => {
  res.status(403).json({
    success: false,
    message,
  });
};

const normalizeAllowedRoles = (roles: unknown[]): UserRole[] => {
  const allowedRoles: UserRole[] = [];

  for (const role of roles) {
    if (Array.isArray(role)) {
      allowedRoles.push(...normalizeAllowedRoles(role));
      continue;
    }

    if (typeof role === "string") {
      allowedRoles.push(role as UserRole);
    }
  }

  return Array.from(new Set(allowedRoles));
};

const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  allowedRoles: UserRole[] = [],
): Promise<void> => {
  const token = extractToken(req);

  if (!token) {
    sendUnauthorized(res, "No auth token provided");
    return;
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      sendUnauthorized(res, "User not found");
      return;
    }

    const serializedUser = serializeUser(user.toObject());

    if (serializedUser.isActive === false) {
      sendForbidden(res, "Your account is inactive");
      return;
    }

    if (
      serializedUser.role !== "client" &&
      serializedUser.approvalStatus !== "approved" &&
      !isPrivilegedRole(serializedUser.role)
    ) {
      sendForbidden(res, "Your account is awaiting approval");
      return;
    }

    if (
      allowedRoles.length > 0 &&
      !allowedRoles.includes(serializedUser.role)
    ) {
      sendForbidden(res, "You do not have access to this resource");
      return;
    }

    req.user = serializedUser;
    req.token = token;
    next();
  } catch {
    sendUnauthorized(res, "Token invalid or expired");
  }
};

export interface ProtectMiddleware {
  (req: Request, res: Response, next: NextFunction): Promise<void> | void;
  (...allowedRoles: UserRole[]): RequestHandler;
}

export const protect = (...allowedRoles: UserRole[]): RequestHandler => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const token = extractToken(req);

    if (!token) {
      return sendUnauthorized(res, "No auth token provided");
    }

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);

      if (!user) {
        return sendUnauthorized(res, "User not found");
      }

      const serializedUser = serializeUser(user.toObject());

      if (serializedUser.isActive === false) {
        return sendForbidden(res, "Your account is inactive");
      }

      if (
        serializedUser.role !== "client" &&
        serializedUser.approvalStatus !== "approved" &&
        !isPrivilegedRole(serializedUser.role)
      ) {
        return sendForbidden(res, "Your account is awaiting approval");
      }

      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(serializedUser.role)
      ) {
        return sendForbidden(res, "You do not have access to this resource");
      }

      req.user = serializedUser;
      req.token = token;

      next();
    } catch {
      return sendUnauthorized(res, "Token invalid or expired");
    }
  };
};

export const authorizeRoles = (...allowedRoles: UserRole[]): RequestHandler => {
  return protect(...allowedRoles);
};

export const requireApproval = (): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { user } = req as AuthenticatedRequest;

    if (!user) {
      sendUnauthorized(res);
      return;
    }

    if (user.approvalStatus !== "approved" && !isPrivilegedRole(user.role)) {
      sendForbidden(res, "Your account is awaiting approval");
      return;
    }

    next();
  };
};

export const requireCrewOrStaff = (): RequestHandler => {
  return protect("crew", "staff");
};

export const requireAdmin = (): RequestHandler => {
  return protect("admin", "super_admin");
};

export const requireSuperAdmin = (): RequestHandler => {
  return protect("super_admin");
};

export const requireOperationalUser = (): RequestHandler => {
  return protect("crew", "staff", "admin", "super_admin");
};
