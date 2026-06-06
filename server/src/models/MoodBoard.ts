import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IMoodBoardItem {
  _id?: Types.ObjectId;
  type: 'image' | 'color' | 'text' | 'reference';
  url?: string;
  color?: string;
  text?: string;
  notes?: string;
}

export interface IMoodBoard extends Document {
  user: Types.ObjectId;
  project?: Types.ObjectId;
  booking?: Types.ObjectId;
  title: string;
  description?: string;
  items: IMoodBoardItem[];
  sharedWith: Types.ObjectId[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const moodBoardItemSchema = new Schema<IMoodBoardItem>(
  {
    type: {
      type: String,
      enum: ['image', 'color', 'text', 'reference'],
      required: true,
    },
    url: { type: String, trim: true },
    color: { type: String, trim: true },
    text: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: true },
);

const moodBoardSchema = new Schema<IMoodBoard>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    items: [moodBoardItemSchema],
    sharedWith: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true },
);

moodBoardSchema.index({ user: 1 });
moodBoardSchema.index({ project: 1 });

export default mongoose.model<IMoodBoard>('MoodBoard', moodBoardSchema);
