import {
  model,
  models,
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export interface IAuthSession extends Document {
  user: Types.ObjectId;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
  lastSeenAt: Date;
  revokedAt?: Date | null;
  revokedReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const authSessionSchema = new Schema<IAuthSession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: { type: String, required: true, unique: true, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    deviceName: { type: String },
    lastSeenAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null, index: true },
    revokedReason: { type: String, default: null },
  },
  { timestamps: true },
);

authSessionSchema.index({ user: 1, revokedAt: 1, updatedAt: -1 });

const AuthSession =
  (models.AuthSession as Model<IAuthSession>) ||
  model<IAuthSession>("AuthSession", authSessionSchema);

export default AuthSession;
