import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPayment extends Document {
  booking: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: "paystack" | "stripe" | "card" | "bank_transfer";
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  transactionId?: string;
  reference?: string;
  paymentGatewayResponse?: Record<string, any>;
  failureReason?: string;
  paidAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema: Schema<IPayment> = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" }, // NGN for Paystack, USD for Stripe
    paymentMethod: {
      type: String,
      enum: ["paystack", "stripe", "card", "bank_transfer"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },
    transactionId: { type: String }, // External transaction ID from payment gateway
    reference: { type: String, unique: true, sparse: true }, // Paystack reference
    paymentGatewayResponse: { type: Schema.Types.Mixed },
    failureReason: { type: String },
    paidAt: { type: Date },
    refundedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
// Remove the following line to avoid duplicate index definition
// paymentSchema.index({ reference: 1 });

export default mongoose.model<IPayment>("Payment", paymentSchema);
