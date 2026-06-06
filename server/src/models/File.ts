import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFile extends Document {
  project: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  fileUrl: string;
  label?: string;
  fileType: "image" | "video" | "audio" | "document";
  fileSize: number;
  isWatermarked: boolean;
  downloadCount: number;
  expiresAt: Date;
  createdAt: Date;
}

const fileSchema: Schema<IFile> = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String, required: true },
    label: { type: String },
    fileType: {
      type: String,
      enum: ["image", "video", "audio", "document"],
      required: true,
    },
    fileSize: { type: Number, required: true },
    isWatermarked: { type: Boolean, default: false },
    downloadCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

fileSchema.index({ project: 1 });
fileSchema.index({ expiresAt: 1 });

export default mongoose.model<IFile>("File", fileSchema);
