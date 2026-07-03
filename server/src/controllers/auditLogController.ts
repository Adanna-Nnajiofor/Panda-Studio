import type { Request, Response } from "express";
import AuditLog from "../models/AuditLog";

export const getAuditLogs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      action,
      entityType,
      actor,
      from,
      to,
      limit = "100",
      page = "1",
    } = req.query as Record<string, string>;

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (actor) query.actor = actor;

    if (from || to) {
      query.createdAt = {};
      if (from)
        (query.createdAt as Record<string, unknown>).$gte = new Date(from);
      if (to) (query.createdAt as Record<string, unknown>).$lte = new Date(to);
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [logs, count] = await Promise.all([
      AuditLog.find(query)
        .populate("actor", "fullName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      count,
      page: safePage,
      totalPages: Math.ceil(count / safeLimit),
      logs,
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch audit logs" });
  }
};

export const getAuditRetentionPolicy = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const retentionDaysRaw = Number(process.env.AUDIT_LOG_RETENTION_DAYS ?? 365);
  const retentionDays = Number.isFinite(retentionDaysRaw)
    ? Math.max(30, retentionDaysRaw)
    : 365;
  res.json({ success: true, retentionDays });
};

export const purgeExpiredAuditLogs = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const now = new Date();
    const result = await AuditLog.deleteMany({ expiresAt: { $lte: now } });
    res.json({ success: true, deletedCount: result.deletedCount ?? 0 });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to purge expired audit logs" });
  }
};
