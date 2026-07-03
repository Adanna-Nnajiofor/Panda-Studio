import mongoose, { Schema, type Document, type Types } from "mongoose";

export type CalendarEventType =
  | "booking"
  | "project"
  | "rental"
  | "event"
  | "manual"
  | "shoot_call"
  | "dpr";

export interface ICalendarEvent extends Document {
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  sourceType?:
    | "booking"
    | "project"
    | "rental"
    | "event"
    | "film_ops"
    | "manual";
  sourceId?: string;
  owner?: Types.ObjectId;
  participants: Types.ObjectId[];
  color?: string;
  status?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const calendarEventSchema = new Schema<ICalendarEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    eventType: {
      type: String,
      enum: [
        "booking",
        "project",
        "rental",
        "event",
        "manual",
        "shoot_call",
        "dpr",
      ],
      required: true,
      index: true,
    },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    allDay: { type: Boolean, default: false },
    sourceType: {
      type: String,
      enum: ["booking", "project", "rental", "event", "film_ops", "manual"],
      default: "manual",
    },
    sourceId: { type: String, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", index: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    color: { type: String, trim: true },
    status: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

calendarEventSchema.index(
  { sourceType: 1, sourceId: 1 },
  { unique: true, sparse: true },
);
calendarEventSchema.index({ owner: 1, startAt: 1 });

export default mongoose.model<ICalendarEvent>(
  "CalendarEvent",
  calendarEventSchema,
);
