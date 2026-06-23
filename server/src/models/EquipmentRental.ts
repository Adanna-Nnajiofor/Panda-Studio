import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEquipmentRental extends Document {
  user: Types.ObjectId;
  equipment: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  durationType: "daily" | "weekly" | "monthly";
  totalAmount: number;
  depositAmount: number;
  renterName?: string;
  contactPhone?: string;
  renterOccupation?: string;
  renterAddress?: string;
  renterLocation?: string;
  productionType?: string;
  shootPurpose?: string;
  identityType?:
    | "NIN"
    | "Voters Card"
    | "International Passport"
    | "Driver License"
    | "Other";
  identityNumber?: string;
  identityDocumentUrl?: string;
  profilePhotoUrl?: string;
  status: "pending" | "confirmed" | "active" | "returned" | "cancelled";
  paymentStatus: "unpaid" | "deposit_paid" | "paid" | "refunded";
  notes?: string;
  referenceNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const ref = () => `RT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

const equipmentRentalSchema = new Schema<IEquipmentRental>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    equipment: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    durationType: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
    },
    totalAmount: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    renterName: { type: String },
    contactPhone: { type: String },
    renterOccupation: { type: String },
    renterAddress: { type: String },
    renterLocation: { type: String },
    productionType: { type: String },
    shootPurpose: { type: String },
    identityType: {
      type: String,
      enum: [
        "NIN",
        "Voters Card",
        "International Passport",
        "Driver License",
        "Other",
      ],
    },
    identityNumber: { type: String },
    identityDocumentUrl: { type: String },
    profilePhotoUrl: { type: String },
    status: {
      type: String,
      enum: ["pending", "confirmed", "active", "returned", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "deposit_paid", "paid", "refunded"],
      default: "unpaid",
    },
    notes: { type: String },
    referenceNumber: { type: String, unique: true, default: ref },
  },
  { timestamps: true },
);

equipmentRentalSchema.index({ user: 1 });
equipmentRentalSchema.index({ equipment: 1 });
equipmentRentalSchema.index({ status: 1 });

export default mongoose.model<IEquipmentRental>(
  "EquipmentRental",
  equipmentRentalSchema,
);
