import mongoose, { Document, Schema, Types } from "mongoose";

export interface IWishlistItem {
  equipment: Types.ObjectId;
  quantity: number;
  durationHours: number;
  savedAt: Date;
  _id: Types.ObjectId;
}

export interface IWishlist extends Document {
  user: Types.ObjectId;
  items: IWishlistItem[];
}

const wishlistItemSchema = new Schema<IWishlistItem>(
  {
    equipment: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    durationHours: { type: Number, required: true, min: 1, default: 2 },
    savedAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: true },
);

const wishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [wishlistItemSchema], default: [] },
  },
  { timestamps: true },
);

wishlistSchema.index({ "items.equipment": 1 });

export default mongoose.model<IWishlist>("Wishlist", wishlistSchema);
