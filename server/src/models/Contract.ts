import mongoose, { Schema, type Document, type Types } from "mongoose";

export type ContractStatus = "draft" | "sent" | "signed" | "cancelled";

export interface IContractParty {
  name: string;
  email?: string;
  role: "client" | "crew" | "vendor" | "studio";
  user?: Types.ObjectId;
}

export interface IContract extends Document {
  title: string;
  contractType: "hire" | "nda" | "usage_rights" | "service";
  project?: Types.ObjectId;
  createdBy: Types.ObjectId;
  parties: IContractParty[];
  deliverables: string[];
  terms: string;
  amount?: number;
  currency: string;
  startDate?: Date;
  endDate?: Date;
  status: ContractStatus;
  sentAt?: Date;
  signedAt?: Date;
  signedBy?: Types.ObjectId;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const partySchema = new Schema<IContractParty>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    role: {
      type: String,
      enum: ["client", "crew", "vendor", "studio"],
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false },
);

const contractSchema = new Schema<IContract>(
  {
    title: { type: String, required: true, trim: true },
    contractType: {
      type: String,
      enum: ["hire", "nda", "usage_rights", "service"],
      required: true,
      index: true,
    },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    parties: {
      type: [partySchema],
      validate: {
        validator: (v: IContractParty[]) => Array.isArray(v) && v.length >= 2,
        message: "At least two contract parties are required",
      },
    },
    deliverables: [{ type: String, trim: true }],
    terms: { type: String, required: true, trim: true },
    amount: { type: Number, min: 0 },
    currency: { type: String, default: "NGN", trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["draft", "sent", "signed", "cancelled"],
      default: "draft",
      index: true,
    },
    sentAt: { type: Date },
    signedAt: { type: Date },
    signedBy: { type: Schema.Types.ObjectId, ref: "User" },
    cancellationReason: { type: String, trim: true },
  },
  { timestamps: true },
);

contractSchema.index({ createdAt: -1 });

export default mongoose.model<IContract>("Contract", contractSchema);
