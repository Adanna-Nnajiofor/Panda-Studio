import {
  model,
  models,
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export interface ILoginHistory extends Document {
  user?: Types.ObjectId;
  email: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
  failureReason?: string;
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const loginHistorySchema = new Schema<ILoginHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    success: { type: Boolean, required: true, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    deviceName: { type: String },
    failureReason: { type: String },
    sessionId: { type: String, index: true },
  },
  { timestamps: true },
);

loginHistorySchema.index({ user: 1, createdAt: -1 });

const LoginHistory =
  (models.LoginHistory as Model<ILoginHistory>) ||
  model<ILoginHistory>("LoginHistory", loginHistorySchema);

export default LoginHistory;
