import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
  user: Types.ObjectId;
  type: "booking" | "payment" | "file_ready" | "message";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema: Schema<INotification> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["booking", "payment", "file_ready", "message"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
