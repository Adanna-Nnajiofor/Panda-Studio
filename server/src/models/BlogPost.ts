import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: Types.ObjectId;
  coverImage?: string;
  tags: string[];
  category:
    | "behind_the_scenes"
    | "tutorial"
    | "news"
    | "feature"
    | "case_study";
  isPublished: boolean;
  publishedAt?: Date;
  views: number;
  projectId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, trim: true, lowercase: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    coverImage: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    category: {
      type: String,
      enum: ["behind_the_scenes", "tutorial", "news", "feature", "case_study"],
      default: "behind_the_scenes",
    },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    views: { type: Number, default: 0 },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
  },
  { timestamps: true },
);

blogPostSchema.index({ isPublished: 1 });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ category: 1 });

// Auto-generate slug from title
blogPostSchema.pre("save", function () {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

export default mongoose.model<IBlogPost>("BlogPost", blogPostSchema);
