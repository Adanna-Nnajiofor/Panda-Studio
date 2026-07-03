import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ILesson extends Document {
  course: Types.ObjectId;
  module: Types.ObjectId;
  title: string;
  slug: string;
  description?: string;
  videoUrl?: string;
  notes?: string;
  pdfUrl?: string;
  resourceUrls: string[];
  durationMinutes?: number;
  order: number;
  isPreview: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    module: {
      type: Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    videoUrl: { type: String, trim: true },
    notes: { type: String },
    pdfUrl: { type: String, trim: true },
    resourceUrls: [{ type: String, trim: true }],
    durationMinutes: { type: Number, min: 0 },
    order: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

lessonSchema.index({ course: 1, module: 1, order: 1 });
lessonSchema.index({ slug: 1, course: 1 }, { unique: true });

export default mongoose.model<ILesson>("Lesson", lessonSchema);
