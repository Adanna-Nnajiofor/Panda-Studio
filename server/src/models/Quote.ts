import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IQuoteItem {
  description: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface IQuote extends Document {
  client: Types.ObjectId;
  createdBy: Types.ObjectId;
  referenceNumber: string;
  items: IQuoteItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  validUntil: Date;
  notes?: string;
  booking?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const quoteItemSchema = new Schema<IQuoteItem>(
  {
    description: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const quoteSchema = new Schema<IQuote>(
  {
    client: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    referenceNumber: {
      type: String,
      unique: true,
      default: () =>
        `QT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    },
    items: [quoteItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "expired"],
      default: "draft",
    },
    validUntil: { type: Date, required: true },
    notes: { type: String, trim: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
  },
  { timestamps: true },
);

quoteSchema.index({ status: 1 });
quoteSchema.index({ referenceNumber: 1 });

export default mongoose.model<IQuote>("Quote", quoteSchema);
