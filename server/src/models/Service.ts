import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  durationInHours: number;
  isActive: boolean;
  coverImage?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema: Schema<IService> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    basePrice: { type: Number, required: true },
    durationInHours: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    coverImage: { type: String },
    images: [{ type: String }],
  },
  { timestamps: true },
);

export default mongoose.model<IService>("Service", serviceSchema);
