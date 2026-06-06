import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  author: Types.ObjectId;
  targetUser?: Types.ObjectId;
  service?: Types.ObjectId;
  equipment?: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
    service: { type: Schema.Types.ObjectId, ref: 'Service' },
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

reviewSchema.index({ targetUser: 1 });

export default mongoose.model<IReview>('Review', reviewSchema);
