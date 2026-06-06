import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IEventRegistration {
  user: Types.ObjectId;
  status: 'registered' | 'cancelled' | 'attended';
  registeredAt: Date;
}

export interface IEvent extends Document {
  title: string;
  description: string;
  type: 'workshop' | 'masterclass' | 'open_day' | 'screening' | 'networking';
  host: Types.ObjectId;
  coverImage?: string;
  date: Date;
  endDate?: Date;
  durationMinutes?: number;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
  maxAttendees?: number;
  price: number;
  currency: string;
  isPublished: boolean;
  registrations: IEventRegistration[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const eventRegistrationSchema = new Schema<IEventRegistration>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['registered', 'cancelled', 'attended'],
      default: 'registered',
    },
    registeredAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['workshop', 'masterclass', 'open_day', 'screening', 'networking'],
      required: true,
    },
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coverImage: { type: String, trim: true },
    date: { type: Date, required: true },
    endDate: { type: Date },
    durationMinutes: { type: Number },
    location: { type: String, required: true, trim: true },
    isVirtual: { type: Boolean, default: false },
    virtualLink: { type: String, trim: true },
    maxAttendees: { type: Number },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'NGN' },
    isPublished: { type: Boolean, default: false },
    registrations: [eventRegistrationSchema],
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

eventSchema.index({ date: 1 });
eventSchema.index({ isPublished: 1 });
eventSchema.index({ type: 1 });

export default mongoose.model<IEvent>('Event', eventSchema);
