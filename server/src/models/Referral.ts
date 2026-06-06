import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IReferral extends Document {
  referrer: Types.ObjectId;
  referee?: Types.ObjectId;
  code: string;
  status: "pending" | "registered" | "completed" | "expired";
  rewardAmount: number;
  rewardPaid: boolean;
  currency: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    referrer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    referee: { type: Schema.Types.ObjectId, ref: "User" },
    code: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
      default: () => Math.random().toString(36).slice(2, 8).toUpperCase(),
    },
    status: {
      type: String,
      enum: ["pending", "registered", "completed", "expired"],
      default: "pending",
    },
    rewardAmount: { type: Number, default: 5000 },
    rewardPaid: { type: Boolean, default: false },
    currency: { type: String, default: "NGN" },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

referralSchema.index({ referrer: 1 });

referralSchema.index({ status: 1 });

export default mongoose.model<IReferral>("Referral", referralSchema);
