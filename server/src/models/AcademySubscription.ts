import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IAcademySubscription extends Document {
  user: Types.ObjectId;
  plan: Types.ObjectId;
  status: "pending" | "active" | "expired" | "cancelled";
  startedAt?: Date;
  expiresAt?: Date;
  paymentReference?: string;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const academySubscriptionSchema = new Schema<IAcademySubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "expired", "cancelled"],
      default: "pending",
      index: true,
    },
    startedAt: { type: Date },
    expiresAt: { type: Date },
    paymentReference: { type: String, trim: true },
    autoRenew: { type: Boolean, default: false },
  },
  { timestamps: true },
);

academySubscriptionSchema.index({ user: 1, status: 1, expiresAt: -1 });

export default mongoose.model<IAcademySubscription>(
  "AcademySubscription",
  academySubscriptionSchema,
);
