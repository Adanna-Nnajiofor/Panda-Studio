import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ICourseModule extends Document {
  course: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseModuleSchema = new Schema<ICourseModule>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

courseModuleSchema.index({ course: 1, order: 1 });

export default mongoose.model<ICourseModule>(
  "CourseModule",
  courseModuleSchema,
);
