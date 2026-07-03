import mongoose, { Schema, type Document, type Types } from "mongoose";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "login"
  | "logout"
  | "sync"
  | "other";

export interface IAuditLog extends Document {
  actor?: Types.ObjectId;
  actorRole?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  message: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const retentionDaysRaw = Number(process.env.AUDIT_LOG_RETENTION_DAYS ?? 365);

const retentionDays = Number.isFinite(retentionDaysRaw)
  ? Math.max(30, retentionDaysRaw)
  : 365;

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    actorRole: {
      type: String,
      trim: true,
    },

    action: {
      type: String,
      enum: [
        "create",
        "update",
        "delete",
        "status_change",
        "login",
        "logout",
        "sync",
        "other",
      ],
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    entityId: {
      type: String,
      trim: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },

    ipAddress: {
      type: String,
      trim: true,
    },

    userAgent: {
      type: String,
      trim: true,
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  },
);

// TTL index - MongoDB automatically deletes expired documents
auditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Helpful query indexes
auditLogSchema.index({ createdAt: -1, entityType: 1 });

export default mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
