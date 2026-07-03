import type { Request } from "express";
import AuditLog, { type AuditAction } from "../models/AuditLog";
import type { AuthenticatedRequest } from "../types/auth";

type LogAuditInput = {
  req?: Request;
  actorId?: string;
  actorRole?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export async function logAudit(input: LogAuditInput): Promise<void> {
  const actor =
    input.actorId ??
    ((input.req as AuthenticatedRequest | undefined)?.user?.id || undefined);
  const actorRole =
    input.actorRole ??
    ((input.req as AuthenticatedRequest | undefined)?.user?.role || undefined);

  const ipAddress = input.req?.ip;
  const userAgent = input.req?.headers?.["user-agent"];

  await AuditLog.create({
    actor: actor || undefined,
    actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    message: input.message,
    metadata: input.metadata,
    ipAddress,
    userAgent: typeof userAgent === "string" ? userAgent : undefined,
  });
}
