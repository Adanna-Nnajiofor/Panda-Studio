import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface IInvoice extends Document {
  referenceNumber: string;
  client: Types.ObjectId;
  booking?: Types.ObjectId;
  createdBy: Types.ObjectId;
  items: IInvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: Date;
  paidAt?: Date | null;
  notes?: string;
  couponCode?: string;
  couponDiscount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const invoiceSchema = new Schema<IInvoice>(
  {
    referenceNumber: {
      type: String,
      unique: true,
      default: () => `INV-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    },
    client: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [itemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled"],
      default: "draft",
      index: true,
    },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date, default: null },
    notes: { type: String, trim: true },
    couponCode: { type: String, trim: true },
    couponDiscount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model<IInvoice>("Invoice", invoiceSchema);
