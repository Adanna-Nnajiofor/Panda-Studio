import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IAvailabilitySchedule extends Document {
  user: Types.ObjectId;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const availabilityScheduleSchema = new Schema<IAvailabilitySchedule>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    timezone: { type: String, default: "Africa/Lagos", trim: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

availabilityScheduleSchema.index({ user: 1, dayOfWeek: 1 }, { unique: true });

export default mongoose.model<IAvailabilitySchedule>(
  "AvailabilitySchedule",
  availabilityScheduleSchema,
);
