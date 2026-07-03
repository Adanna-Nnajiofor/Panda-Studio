import mongoose, { Schema, type Document } from "mongoose";

export interface ICourseCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseCategorySchema = new Schema<ICourseCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

courseCategorySchema.index({ isActive: 1, order: 1, name: 1 });

export default mongoose.model<ICourseCategory>(
  "CourseCategory",
  courseCategorySchema,
);
