import mongoose, { Schema, Document, Types } from "mongoose";

export type NotificationType =
  | "booking"
  | "payment"
  | "file_ready"
  | "message"
  | "crew_application"
  | "account_approved"
  | "project_update"
  | "reminder"
  | "system";

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema: Schema<INotification> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["booking", "payment", "file_ready", "message", "crew_application", "account_approved", "project_update", "reminder", "system"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: null },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, isRead: 1 });

export default mongoose.model<INotification>("Notification", notificationSchema);
