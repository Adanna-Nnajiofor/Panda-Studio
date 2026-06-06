import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEquipment extends Document {
  name: string;
  type: string;
  description?: string;
  hourlyRate: number;
  quantity: number;
  isActive: boolean;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const equipmentSchema: Schema<IEquipment> = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String },
    hourlyRate: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    isActive: { type: Boolean, default: true },
    images: [{ type: String }],
  },
  { timestamps: true },
);

equipmentSchema.index({ name: 1 });
equipmentSchema.index({ type: 1 });

export default mongoose.model<IEquipment>("Equipment", equipmentSchema);
