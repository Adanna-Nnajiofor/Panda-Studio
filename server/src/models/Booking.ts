import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBooking extends Document {
  user: Types.ObjectId;
  service: Types.ObjectId;
  equipment?: Types.ObjectId[];
  bookingDate: Date;
  bookingTime: string;
  duration: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "deposit_paid" | "paid" | "refunded";
  totalAmount: number;
  notes?: string;
  referenceNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const generateReferenceNumber = () =>
  `BK-${Math.random().toString(36).slice(2, 12).toUpperCase()}`;

const bookingSchema: Schema<IBooking> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    equipment: [{ type: Schema.Types.ObjectId, ref: "Equipment" }],
    bookingDate: { type: Date, required: true },
    bookingTime: { type: String, required: true },
    duration: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "deposit_paid", "paid", "refunded"],
      default: "unpaid",
    },
    totalAmount: { type: Number, required: true },
    notes: { type: String },
    referenceNumber: {
      type: String,
      unique: true,
      default: generateReferenceNumber,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual to populate related project
bookingSchema.virtual("project", {
  ref: "Project",
  localField: "_id",
  foreignField: "booking",
  justOne: true,
});

// Indexes
bookingSchema.index({ user: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ status: 1 });

export default mongoose.model<IBooking>("Booking", bookingSchema);
