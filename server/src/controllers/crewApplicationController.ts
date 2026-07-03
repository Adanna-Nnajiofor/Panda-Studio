import type { Request, Response } from "express";
import CrewApplication from "../models/CrewApplication";
import User from "../models/User";
import type { AuthenticatedRequest } from "../types/auth";
import { canManageUsers, isPrivilegedRole, serializeUser } from "../utils/user";

const getAuthUser = (req: Request) =>
  (req as AuthenticatedRequest).user;

const getParamId = (req: Request): string =>
  Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

// POST /api/crew-applications
export const submitCrewApplication = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const user = await User.findById(authUser.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "crew") {
      return res.status(400).json({ success: false, message: "You are already a crew member" });
    }

    if (isPrivilegedRole(user.role)) {
      return res.status(400).json({ success: false, message: "Your account already has an operational role" });
    }

    const existing = await CrewApplication.findOne({
      user: authUser.id,
      status: "pending",
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending crew application",
        application: existing,
      });
    }

    const {
      bio,
      specialties,
      yearsOfExperience,
      hourlyRate,
      showreelUrl,
      portfolioUrl,
      equipmentOwned,
      position,
      department,
      phone,
    } = req.body as {
      bio?: string;
      specialties?: string | string[];
      yearsOfExperience?: number | string;
      hourlyRate?: number | string;
      showreelUrl?: string;
      portfolioUrl?: string;
      equipmentOwned?: string | string[];
      position?: string;
      department?: string;
      phone?: string;
    };

    if (!bio || String(bio).trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: "Bio must be at least 20 characters",
      });
    }

    const toArray = (val: string | string[] | undefined): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map((s) => s.trim()).filter(Boolean);
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const application = await CrewApplication.create({
      user: authUser.id,
      bio: String(bio).trim(),
      specialties: toArray(specialties),
      yearsOfExperience: Number(yearsOfExperience) || 0,
      hourlyRate: Number(hourlyRate) || 0,
      showreelUrl: String(showreelUrl ?? "").trim(),
      portfolioUrl: String(portfolioUrl ?? "").trim(),
      equipmentOwned: toArray(equipmentOwned),
      position: String(position ?? "").trim(),
      department: String(department ?? "").trim(),
      phone: String(phone ?? "").trim(),
      status: "pending",
    });

    // Mark on user for quick header/nav checks — does NOT change role
    user.requestedRole = "crew";
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Crew application submitted",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to submit application",
    });
  }
};

// GET /api/crew-applications/my
export const getMyApplication = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const application = await CrewApplication.findOne({ user: authUser.id })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, application: application ?? null });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch application",
    });
  }
};

// GET /api/crew-applications  (admin)
export const listCrewApplications = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || !canManageUsers(authUser.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { status } = req.query as { status?: string };
    const filter: Record<string, unknown> = {};
    if (status === "pending" || status === "approved" || status === "rejected") {
      filter.status = status;
    }

    const applications = await CrewApplication.find(filter)
      .populate("user", "fullName email role phone avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch applications",
    });
  }
};

// PATCH /api/crew-applications/:id/approve  (admin)
export const approveCrewApplication = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || !canManageUsers(authUser.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const id = getParamId(req);
    const application = await CrewApplication.findById(id);

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status}`,
      });
    }

    // Update application record — permanent audit trail
    application.status = "approved";
    application.reviewedBy = authUser.id as never;
    application.reviewedAt = new Date();
    await application.save();

    // Promote user role
    const user = await User.findById(application.user);
    if (user) {
      user.role = "crew";
      user.requestedRole = null;
      user.isApproved = true;
      user.isActive = true;
      user.approvalStatus = "approved";
      user.availability = user.availability === "offline" ? "available" : user.availability;
      user.approvedBy = authUser.id as never;
      user.approvedAt = new Date();
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Crew application approved",
      application,
      user: user ? serializeUser(user.toObject()) : null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to approve application",
    });
  }
};

// PATCH /api/crew-applications/:id/reject  (admin)
export const rejectCrewApplication = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || !canManageUsers(authUser.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const id = getParamId(req);
    const application = await CrewApplication.findById(id);

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status}`,
      });
    }

    // Update application record — permanent audit trail
    application.status = "rejected";
    application.reviewedBy = authUser.id as never;
    application.reviewedAt = new Date();
    await application.save();

    // Clear requestedRole on user — they remain a client
    await User.findByIdAndUpdate(application.user, {
      requestedRole: null,
      approvalStatus: "rejected",
    });

    return res.status(200).json({
      success: true,
      message: "Crew application rejected",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to reject application",
    });
  }
};
