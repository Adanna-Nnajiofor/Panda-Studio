import mongoose, { Schema, type Document } from "mongoose";

export interface IAward extends Document {
  title: string;
  issuer: string;
  year: number;
  category?: string;
  projectName?: string;
  imageUrl?: string;
  externalUrl?: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const awardSchema = new Schema<IAward>(
  {
    title: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1900, max: 2100 },
    category: { type: String, trim: true },
    projectName: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    externalUrl: { type: String, trim: true },
    isPublished: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

awardSchema.index({ year: -1, sortOrder: 1, createdAt: -1 });

export default mongoose.model<IAward>("Award", awardSchema);
