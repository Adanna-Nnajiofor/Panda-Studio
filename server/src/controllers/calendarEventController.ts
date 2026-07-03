import type { Request, Response } from "express";
import Booking from "../models/Booking";
import CalendarEvent from "../models/CalendarEvent";
import EquipmentRental from "../models/EquipmentRental";
import Event from "../models/Event";
import Project from "../models/Project";
import type { AuthenticatedRequest } from "../types/auth";
import { logAudit } from "../utils/audit";

const asDate = (value?: string): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const listCalendarEvents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const from = asDate((req.query.from as string | undefined) ?? undefined);
    const to = asDate((req.query.to as string | undefined) ?? undefined);

    const query: Record<string, unknown> = {};
    if (from || to) {
      query.startAt = {};
      if (from) (query.startAt as Record<string, unknown>).$gte = from;
      if (to) (query.startAt as Record<string, unknown>).$lte = to;
    }

    if (user?.role === "client" || user?.role === "crew") {
      query.$or = [{ owner: user.id }, { participants: user.id }];
    }

    const events = await CalendarEvent.find(query).sort({ startAt: 1 });
    res.json({ success: true, count: events.length, events });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch calendar events" });
  }
};

export const createCalendarEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const event = await CalendarEvent.create({
      ...req.body,
      owner: req.body.owner ?? user?.id,
      sourceType: req.body.sourceType ?? "manual",
    });

    await logAudit({
      req,
      action: "create",
      entityType: "calendar_event",
      entityId: String(event._id),
      message: `Calendar event created: ${event.title}`,
    });

    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create event",
    });
  }
};

export const updateCalendarEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const event = await CalendarEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!event) {
      res
        .status(404)
        .json({ success: false, message: "Calendar event not found" });
      return;
    }

    await logAudit({
      req,
      action: "update",
      entityType: "calendar_event",
      entityId: String(event._id),
      message: `Calendar event updated: ${event.title}`,
    });

    res.json({ success: true, event });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to update calendar event" });
  }
};

export const deleteCalendarEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const event = await CalendarEvent.findByIdAndDelete(req.params.id);

    if (!event) {
      res
        .status(404)
        .json({ success: false, message: "Calendar event not found" });
      return;
    }

    await logAudit({
      req,
      action: "delete",
      entityType: "calendar_event",
      entityId: String(event._id),
      message: `Calendar event deleted: ${event.title}`,
    });

    res.json({ success: true, message: "Calendar event deleted" });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete calendar event" });
  }
};

export const syncCalendarEvents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [bookings, projects, rentals, events] = await Promise.all([
      Booking.find().populate("service", "name").lean(),
      Project.find().populate("client", "fullName").lean(),
      EquipmentRental.find().populate("equipment", "name").lean(),
      Event.find({ isPublished: true }).lean(),
    ]);

    const ops: Promise<unknown>[] = [];

    for (const booking of bookings) {
      const start = new Date(booking.bookingDate);
      const durationHours = Number(booking.duration) || 1;
      const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
      const serviceName =
        booking.service &&
        typeof booking.service === "object" &&
        "name" in booking.service
          ? String(
              (booking.service as Record<string, unknown>).name ?? "Booking",
            )
          : "Booking";

      ops.push(
        CalendarEvent.updateOne(
          { sourceType: "booking", sourceId: String(booking._id) },
          {
            $set: {
              title: `${serviceName} booking`,
              eventType: "booking",
              startAt: start,
              endAt: end,
              owner: booking.user,
              sourceType: "booking",
              sourceId: String(booking._id),
              status: booking.status,
              metadata: {
                bookingTime: booking.bookingTime,
                paymentStatus: booking.paymentStatus,
              },
            },
          },
          { upsert: true },
        ),
      );
    }

    for (const project of projects) {
      const due = new Date(project.expiryDate);
      ops.push(
        CalendarEvent.updateOne(
          { sourceType: "project", sourceId: String(project._id) },
          {
            $set: {
              title: `Project due: ${project.progressStatus}`,
              eventType: "project",
              startAt: due,
              endAt: due,
              allDay: true,
              owner: project.client,
              sourceType: "project",
              sourceId: String(project._id),
              status: project.progressStatus,
            },
          },
          { upsert: true },
        ),
      );
    }

    for (const rental of rentals) {
      const equipmentName =
        rental.equipment &&
        typeof rental.equipment === "object" &&
        "name" in rental.equipment
          ? String(
              (rental.equipment as Record<string, unknown>).name ?? "Equipment",
            )
          : "Equipment";

      ops.push(
        CalendarEvent.updateOne(
          { sourceType: "rental", sourceId: String(rental._id) },
          {
            $set: {
              title: `Rental: ${equipmentName}`,
              eventType: "rental",
              startAt: new Date(rental.startDate),
              endAt: new Date(rental.endDate),
              owner: rental.user,
              sourceType: "rental",
              sourceId: String(rental._id),
              status: rental.status,
            },
          },
          { upsert: true },
        ),
      );
    }

    for (const evt of events) {
      const endAt = evt.endDate ? new Date(evt.endDate) : new Date(evt.date);
      ops.push(
        CalendarEvent.updateOne(
          { sourceType: "event", sourceId: String(evt._id) },
          {
            $set: {
              title: evt.title,
              description: evt.description,
              eventType: "event",
              startAt: new Date(evt.date),
              endAt,
              sourceType: "event",
              sourceId: String(evt._id),
              status: evt.isPublished ? "published" : "draft",
              metadata: { location: evt.location, type: evt.type },
            },
          },
          { upsert: true },
        ),
      );
    }

    await Promise.all(ops);

    await logAudit({
      req,
      action: "sync",
      entityType: "calendar_event",
      message: "Calendar sync completed",
      metadata: {
        bookings: bookings.length,
        projects: projects.length,
        rentals: rentals.length,
        events: events.length,
      },
    });

    res.json({
      success: true,
      synced: {
        bookings: bookings.length,
        projects: projects.length,
        rentals: rentals.length,
        events: events.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to sync calendar",
    });
  }
};
