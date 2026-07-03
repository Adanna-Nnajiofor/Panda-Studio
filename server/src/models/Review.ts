import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReview extends Document {
  author: Types.ObjectId;
  targetUser?: Types.ObjectId;
  service?: Types.ObjectId;
  equipment?: Types.ObjectId;
  studioRoom?: Types.ObjectId;
  targetType: "crew" | "service" | "equipment" | "studio_room";
  revieweeRole?: "crew" | "service" | "equipment" | "studio_room";
  rating: number;
  comment?: string;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: "User" },
    service: { type: Schema.Types.ObjectId, ref: "Service" },
    equipment: { type: Schema.Types.ObjectId, ref: "Equipment" },
    studioRoom: { type: Schema.Types.ObjectId, ref: "StudioRoom" },
    targetType: {
      type: String,
      enum: ["crew", "service", "equipment", "studio_room"],
      required: true,
      index: true,
    },
    revieweeRole: {
      type: String,
      enum: ["crew", "service", "equipment", "studio_room"],
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

reviewSchema.index({ targetUser: 1 });
reviewSchema.index({ service: 1 });
reviewSchema.index({ equipment: 1 });
reviewSchema.index({ studioRoom: 1 });
reviewSchema.index({
  author: 1,
  targetType: 1,
  targetUser: 1,
  service: 1,
  equipment: 1,
  studioRoom: 1,
});

export default mongoose.model<IReview>("Review", reviewSchema);
