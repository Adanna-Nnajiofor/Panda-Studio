import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IAcademyPayment extends Document {
  user: Types.ObjectId;
  course?: Types.ObjectId;
  membershipPlan?: Types.ObjectId;
  paymentFor: "course" | "membership";
  amount: number;
  currency: string;
  paymentMethod: "paystack" | "flutterwave";
  status: "pending" | "completed" | "failed" | "refunded";
  reference: string;
  transactionId?: string;
  paymentGatewayResponse?: Record<string, unknown>;
  failureReason?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const academyPaymentSchema = new Schema<IAcademyPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      index: true,
    },
    membershipPlan: {
      type: Schema.Types.ObjectId,
      ref: "MembershipPlan",
      index: true,
    },
    paymentFor: {
      type: String,
      enum: ["course", "membership"],
      default: "course",
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NGN", trim: true },
    paymentMethod: {
      type: String,
      enum: ["paystack", "flutterwave"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    reference: { type: String, required: true, unique: true, trim: true },
    transactionId: { type: String, trim: true },
    paymentGatewayResponse: { type: Schema.Types.Mixed },
    failureReason: { type: String, trim: true },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

academyPaymentSchema.index({ user: 1, createdAt: -1 });
academyPaymentSchema.index({ user: 1, course: 1, status: 1 });
academyPaymentSchema.index({ user: 1, membershipPlan: 1, status: 1 });

export default mongoose.model<IAcademyPayment>(
  "AcademyPayment",
  academyPaymentSchema,
);
