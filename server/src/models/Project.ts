import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IProject extends Document {
  booking: Types.ObjectId;
  client: Types.ObjectId;
  createdBy?: Types.ObjectId;
  assignedCrew: Types.ObjectId[];
  assignedStaff: Types.ObjectId[];
  assignedUsers: Types.ObjectId[];
  progressStatus:
    | 'pre_production'
    | 'shooting'
    | 'editing'
    | 'ready_for_delivery'
    | 'delivered';
  expiryDate: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema: Schema<IProject> = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedCrew: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    assignedStaff: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    assignedUsers: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    progressStatus: {
      type: String,
      enum: ['pre_production', 'shooting', 'editing', 'ready_for_delivery', 'delivered'],
      default: 'pre_production',
    },
    expiryDate: { type: Date, required: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<IProject>('Project', projectSchema);