import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICartItem {
  _id?: Types.ObjectId;
  equipment: Types.ObjectId;
  quantity: number;
  // duration is in hours to align with Booking.duration
  durationHours: number;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
}

const cartItemSchema = new Schema<ICartItem>(
  {
    equipment: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    durationHours: { type: Number, required: true, min: 1, default: 2 },
  },
  { _id: true },
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

cartSchema.index({ "items.equipment": 1 });

export default mongoose.model<ICart>("Cart", cartSchema);
