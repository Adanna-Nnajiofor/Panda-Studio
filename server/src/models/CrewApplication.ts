import { model, models, Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export type CrewApplicationStatus = "pending" | "approved" | "rejected";

export interface ICrewApplication {
  user: Types.ObjectId;
  bio: string;
  specialties: string[];
  yearsOfExperience: number;
  hourlyRate: number;
  showreelUrl: string;
  portfolioUrl: string;
  equipmentOwned: string[];
  position: string;
  department: string;
  phone: string;
  status: CrewApplicationStatus;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CrewApplicationDocument = HydratedDocument<ICrewApplication>;

const crewApplicationSchema = new Schema<ICrewApplication>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bio: { type: String, required: true, trim: true },
    specialties: [{ type: String, trim: true }],
    yearsOfExperience: { type: Number, default: 0, min: 0 },
    hourlyRate: { type: Number, default: 0, min: 0 },
    showreelUrl: { type: String, trim: true, default: "" },
    portfolioUrl: { type: String, trim: true, default: "" },
    equipmentOwned: [{ type: String, trim: true }],
    position: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

const CrewApplication =
  (models.CrewApplication as Model<ICrewApplication>) ||
  model<ICrewApplication>("CrewApplication", crewApplicationSchema);

export default CrewApplication;
