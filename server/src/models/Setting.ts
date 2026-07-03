import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ISetting extends Document {
  key: string;
  value: unknown;
  scope: "public" | "admin" | "system";
  description?: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    value: { type: Schema.Types.Mixed, required: true },
    scope: {
      type: String,
      enum: ["public", "admin", "system"],
      default: "system",
      index: true,
    },
    description: { type: String, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

settingSchema.index({ scope: 1, key: 1 });

export default mongoose.model<ISetting>("Setting", settingSchema);
