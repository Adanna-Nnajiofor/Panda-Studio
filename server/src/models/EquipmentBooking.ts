import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IEquipmentBooking extends Document {
  user: Types.ObjectId;
  equipment: Types.ObjectId;
  quantity: number;
  startDate: Date;
  endDate: Date;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "deposit_paid" | "paid" | "refunded";
  totalAmount: number;
  depositAmount: number;
  referenceNumber: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentBookingSchema = new Schema<IEquipmentBooking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    equipment: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "active", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "deposit_paid", "paid", "refunded"],
      default: "unpaid",
      index: true,
    },
    totalAmount: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, default: 0, min: 0 },
    referenceNumber: {
      type: String,
      unique: true,
      default: () =>
        `EQB-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

equipmentBookingSchema.index({ equipment: 1, startDate: 1, endDate: 1 });

export default mongoose.model<IEquipmentBooking>(
  "EquipmentBooking",
  equipmentBookingSchema,
);
