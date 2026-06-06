import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IPortfolioItem {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  type: "video" | "image" | "audio";
  tags: string[];
  projectId?: Types.ObjectId;
  views: number;
  isFeatured: boolean;
  createdAt?: Date;
}

export interface IPortfolio extends Document {
  user: Types.ObjectId;
  bio?: string;
  showreelUrl?: string;
  items: IPortfolioItem[];
  isPublic: boolean;
  specialties: string[];
  experienceYears?: number;
  hourlyRate?: number;
  location?: string;
  website?: string;
  socialLinks: { platform: string; url: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const portfolioItemSchema = new Schema<IPortfolioItem>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    mediaUrl: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, trim: true },
    type: { type: String, enum: ["video", "image", "audio"], default: "image" },
    tags: [{ type: String, trim: true }],
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const portfolioSchema = new Schema<IPortfolio>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: { type: String, trim: true },
    showreelUrl: { type: String, trim: true },
    items: [portfolioItemSchema],
    isPublic: { type: Boolean, default: true },
    specialties: [{ type: String, trim: true }],
    experienceYears: { type: Number },
    hourlyRate: { type: Number },
    location: { type: String, trim: true },
    website: { type: String, trim: true },
    socialLinks: [
      {
        platform: { type: String, trim: true },
        url: { type: String, trim: true },
        _id: false,
      },
    ],
  },
  { timestamps: true },
);

portfolioSchema.index({ isPublic: 1 });

export default mongoose.model<IPortfolio>("Portfolio", portfolioSchema);
