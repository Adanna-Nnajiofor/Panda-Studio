import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  project?: Types.ObjectId;
  message: string;
  attachments: {
    url: string;
    fileName?: string;
    mimeType?: string;
    size?: number;
  }[];
  isRead: boolean;
  createdAt: Date;
}

const messageSchema: Schema<IMessage> = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    message: { type: String, required: true },
    attachments: [
      {
        url: { type: String, required: true },
        fileName: { type: String },
        mimeType: { type: String },
        size: { type: Number },
      },
    ],
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<IMessage>("Message", messageSchema);
