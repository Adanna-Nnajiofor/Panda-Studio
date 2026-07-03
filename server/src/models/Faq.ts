import mongoose, { Schema, type Document } from "mongoose";

export interface IFaq extends Document {
  question: string;
  answer: string;
  category?: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    order: { type: Number, default: 0, index: true },
    isPublished: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

faqSchema.index({ isPublished: 1, order: 1, createdAt: -1 });

export default mongoose.model<IFaq>("Faq", faqSchema);
