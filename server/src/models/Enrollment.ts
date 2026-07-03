import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IEnrollment extends Document {
  user: Types.ObjectId;
  course: Types.ObjectId;
  status: "active" | "completed" | "cancelled";
  accessType: "free" | "paid" | "membership" | "manual";
  progressPercent: number;
  enrolledAt: Date;
  lastAccessedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
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
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    accessType: {
      type: String,
      enum: ["free", "paid", "membership", "manual"],
      default: "free",
    },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    enrolledAt: { type: Date, default: Date.now },
    lastAccessedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.model<IEnrollment>("Enrollment", enrollmentSchema);
