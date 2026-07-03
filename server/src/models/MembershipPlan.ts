import mongoose, { Schema, type Document } from "mongoose";

export interface IMembershipPlan extends Document {
  code: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  features: string[];
  isActive: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const membershipPlanSchema = new Schema<IMembershipPlan>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NGN", trim: true },
    interval: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    features: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true, index: true },
    isPublic: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

membershipPlanSchema.index({ isPublic: 1, isActive: 1, price: 1 });

export default mongoose.model<IMembershipPlan>(
  "MembershipPlan",
  membershipPlanSchema,
);
