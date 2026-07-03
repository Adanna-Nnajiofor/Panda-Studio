import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IStudioBooking extends Document {
  user: Types.ObjectId;
  studioRoom: Types.ObjectId;
  bookingDate: Date;
  bookingTime: string;
  durationHours: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  totalAmount: number;
  referenceNumber: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const studioBookingSchema = new Schema<IStudioBooking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studioRoom: {
      type: Schema.Types.ObjectId,
      ref: "StudioRoom",
      required: true,
      index: true,
    },
    bookingDate: { type: Date, required: true, index: true },
    bookingTime: { type: String, required: true, trim: true },
    durationHours: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    totalAmount: { type: Number, required: true, min: 0 },
    referenceNumber: {
      type: String,
      unique: true,
      default: () =>
        `SRB-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

studioBookingSchema.index({ studioRoom: 1, bookingDate: 1, bookingTime: 1 });

export default mongoose.model<IStudioBooking>(
  "StudioBooking",
  studioBookingSchema,
);
