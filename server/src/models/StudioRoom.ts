import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudioRoom extends Document {
  name: string;
  slug: string;
  description?: string;
  capacity: number;
  amenities: string[];
  basePrice: number;
  isActive: boolean;
  isFeatured: boolean;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const studioRoomSchema: Schema<IStudioRoom> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    capacity: { type: Number, required: true, min: 1 },
    amenities: [{ type: String }],
    basePrice: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    images: [{ type: String }],
  },
  { timestamps: true },
);

studioRoomSchema.index({ name: 1 });
studioRoomSchema.index({ isFeatured: 1, isActive: 1, name: 1 });

export default mongoose.model<IStudioRoom>("StudioRoom", studioRoomSchema);
