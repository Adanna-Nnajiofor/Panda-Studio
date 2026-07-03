import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ICallSheet {
  shootDate: Date;
  callTime: string;
  wrapTime?: string;
  location: string;
  sceneNotes?: string;
}

export interface IDailyProductionReport {
  reportDate: Date;
  completedScenes: string[];
  delays?: string;
  incidents?: string;
  weather?: string;
  notes?: string;
}

export interface IAttendanceEntry {
  user: Types.ObjectId;
  roleLabel?: string;
  date: Date;
  status: "present" | "absent" | "late";
  note?: string;
}

export interface ILocationEntry {
  name: string;
  address: string;
  permitStatus: "pending" | "approved" | "rejected";
  contactName?: string;
  contactPhone?: string;
  notes?: string;
}

export interface ITalentEntry {
  name: string;
  roleName: string;
  contactEmail?: string;
  contactPhone?: string;
  rate?: number;
  status: "hold" | "booked" | "released";
}

export interface IFilmOpsProject extends Document {
  title: string;
  project?: Types.ObjectId;
  booking?: Types.ObjectId;
  owner: Types.ObjectId;
  callSheets: ICallSheet[];
  dprs: IDailyProductionReport[];
  attendance: IAttendanceEntry[];
  locations: ILocationEntry[];
  talents: ITalentEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const callSheetSchema = new Schema<ICallSheet>(
  {
    shootDate: { type: Date, required: true },
    callTime: { type: String, required: true, trim: true },
    wrapTime: { type: String, trim: true },
    location: { type: String, required: true, trim: true },
    sceneNotes: { type: String, trim: true },
  },
  { _id: true },
);

const dprSchema = new Schema<IDailyProductionReport>(
  {
    reportDate: { type: Date, required: true },
    completedScenes: [{ type: String, trim: true }],
    delays: { type: String, trim: true },
    incidents: { type: String, trim: true },
    weather: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: true },
);

const attendanceSchema = new Schema<IAttendanceEntry>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roleLabel: { type: String, trim: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      default: "present",
    },
    note: { type: String, trim: true },
  },
  { _id: true },
);

const locationSchema = new Schema<ILocationEntry>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    permitStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    contactName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: true },
);

const talentSchema = new Schema<ITalentEntry>(
  {
    name: { type: String, required: true, trim: true },
    roleName: { type: String, required: true, trim: true },
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    rate: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ["hold", "booked", "released"],
      default: "hold",
    },
  },
  { _id: true },
);

const filmOpsProjectSchema = new Schema<IFilmOpsProject>(
  {
    title: { type: String, required: true, trim: true },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    callSheets: [callSheetSchema],
    dprs: [dprSchema],
    attendance: [attendanceSchema],
    locations: [locationSchema],
    talents: [talentSchema],
  },
  { timestamps: true },
);

filmOpsProjectSchema.index({ title: 1 });
filmOpsProjectSchema.index({ project: 1 });

export default mongoose.model<IFilmOpsProject>(
  "FilmOpsProject",
  filmOpsProjectSchema,
);
