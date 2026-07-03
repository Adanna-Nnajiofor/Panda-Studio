import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ICourse extends Document {
  title: string;
  slug: string;
  summary: string;
  description?: string;
  category: Types.ObjectId;
  level: "beginner" | "intermediate" | "advanced";
  pricingType: "free" | "paid" | "membership";
  price: number;
  currency: string;
  instructorName?: string;
  coverImage?: string;
  tags: string[];
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    summary: { type: String, required: true, trim: true },
    description: { type: String },
    category: {
      type: Schema.Types.ObjectId,
      ref: "CourseCategory",
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    pricingType: {
      type: String,
      enum: ["free", "paid", "membership"],
      default: "free",
      index: true,
    },
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "NGN", trim: true },
    instructorName: { type: String, trim: true },
    coverImage: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

courseSchema.index({ title: 1 });

courseSchema.index({ isPublished: 1, publishedAt: -1 });

export default mongoose.model<ICourse>("Course", courseSchema);
