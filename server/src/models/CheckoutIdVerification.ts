import mongoose, { Document, Schema, Types } from "mongoose";

export type IdVerificationStatus = "pending" | "verified" | "rejected";

export interface ICheckoutIdVerification extends Document {
  user: Types.ObjectId;
  status: IdVerificationStatus;
  cloudinaryAssetId?: string;
  cloudinaryUrl?: string;
  rejectionReason?: string;
  // Draft booking data captured from the checkout page
  bookingDraft?: {
    service: Types.ObjectId;
    equipment?: Types.ObjectId[];
    bookingDate: Date;
    bookingTime: string;
    duration: number;
    totalAmount: number;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const bookingDraftSchema = new Schema(
  {
    service: { type: Schema.Types.ObjectId, ref: "Service" },
    equipment: [{ type: Schema.Types.ObjectId, ref: "Equipment" }],
    bookingDate: { type: Date },
    bookingTime: { type: String },
    duration: { type: Number },
    totalAmount: { type: Number },
    notes: { type: String },
  },
  { _id: false },
);

const checkoutVerificationSchema = new Schema<ICheckoutIdVerification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    cloudinaryAssetId: { type: String },
    cloudinaryUrl: { type: String },
    rejectionReason: { type: String },
    bookingDraft: { type: bookingDraftSchema },
  },
  { timestamps: true },
);

export default mongoose.model<ICheckoutIdVerification>(
  "CheckoutIdVerification",
  checkoutVerificationSchema,
);
