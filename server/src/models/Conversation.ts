import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IConversationMessage {
  author: Types.ObjectId;
  body: string;
  attachments: string[];
  sentAt: Date;
  readBy: Types.ObjectId[];
}

export interface IConversation extends Document {
  title?: string;
  participants: Types.ObjectId[];
  isGroup: boolean;
  createdBy: Types.ObjectId;
  messages: IConversationMessage[];
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IConversationMessage>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
    attachments: [{ type: String, trim: true }],
    sentAt: { type: Date, default: Date.now },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: true },
);

const conversationSchema = new Schema<IConversation>(
  {
    title: { type: String, trim: true },
    participants: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    isGroup: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    messages: [messageSchema],
    lastMessageAt: { type: Date },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

export default mongoose.model<IConversation>(
  "Conversation",
  conversationSchema,
);
