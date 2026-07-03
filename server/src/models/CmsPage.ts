import mongoose, { Schema, type Document } from "mongoose";

export interface ICmsSection {
  title: string;
  content?: string;
  bullets?: string[];
}

export interface ICmsPage extends Document {
  slug: string;
  title: string;
  heroTitle?: string;
  heroSubtitle?: string;
  ctaPrimaryLabel?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  sections: ICmsSection[];
  isPublished: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const cmsSectionSchema = new Schema<ICmsSection>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, trim: true },
    bullets: [{ type: String, trim: true }],
  },
  { _id: false },
);

const cmsPageSchema = new Schema<ICmsPage>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    heroTitle: { type: String, trim: true },
    heroSubtitle: { type: String, trim: true },
    ctaPrimaryLabel: { type: String, trim: true },
    ctaPrimaryHref: { type: String, trim: true },
    ctaSecondaryLabel: { type: String, trim: true },
    ctaSecondaryHref: { type: String, trim: true },
    sections: { type: [cmsSectionSchema], default: [] },
    isPublished: { type: Boolean, default: true, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

cmsPageSchema.index({ slug: 1, isPublished: 1 });

export default mongoose.model<ICmsPage>("CmsPage", cmsPageSchema);
