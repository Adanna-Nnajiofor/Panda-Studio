import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IHireRequest extends Document {
  client: Types.ObjectId;
  crew: Types.ObjectId;
  project?: Types.ObjectId;
  message: string;
  proposedRate?: number;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const hireRequestSchema = new Schema<IHireRequest>(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    crew: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    message: { type: String, required: true },
    proposedRate: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

hireRequestSchema.index({ crew: 1, status: 1 });
hireRequestSchema.index({ client: 1 });

export default mongoose.model<IHireRequest>('HireRequest', hireRequestSchema);
