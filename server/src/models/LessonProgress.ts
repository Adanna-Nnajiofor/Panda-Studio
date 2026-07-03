import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ILessonProgress extends Document {
  user: Types.ObjectId;
  course: Types.ObjectId;
  lesson: Types.ObjectId;
  status: "not_started" | "in_progress" | "completed";
  lastPositionSeconds: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const lessonProgressSchema = new Schema<ILessonProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },
    lastPositionSeconds: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

lessonProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });

export default mongoose.model<ILessonProgress>(
  "LessonProgress",
  lessonProgressSchema,
);
