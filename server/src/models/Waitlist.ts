import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IWaitlist extends Document {
  user: Types.ObjectId;
  service: Types.ObjectId;
  requestedDate: Date;
  requestedTime: string;
  duration: number;
  status: "waiting" | "notified" | "booked" | "expired";
  notifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const waitlistSchema = new Schema<IWaitlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true, index: true },
    requestedDate: { type: Date, required: true },
    requestedTime: { type: String, required: true },
    duration: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["waiting", "notified", "booked", "expired"],
      default: "waiting",
      index: true,
    },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

waitlistSchema.index({ service: 1, requestedDate: 1, status: 1 });

export default mongoose.model<IWaitlist>("Waitlist", waitlistSchema);
