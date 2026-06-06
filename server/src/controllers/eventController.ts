import type { Request, Response } from 'express';
import Event from '../models/Event';
import type { AuthenticatedRequest } from '../types/auth';
import { isPrivilegedRole } from '../utils/user';

const getUser = (req: Request) => (req as AuthenticatedRequest).user;

export const getPublishedEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query as { type?: string };
    const filter: Record<string, unknown> = { isPublished: true, date: { $gte: new Date() } };
    if (type) filter.type = type;
    const events = await Event.find(filter)
      .populate('host', 'fullName avatar')
      .sort({ date: 1 });
    res.json({ success: true, count: events.length, events });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
};

export const getAllEvents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find().populate('host', 'fullName avatar').sort({ date: -1 });
    res.json({ success: true, count: events.length, events });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('host', 'fullName avatar bio')
      .populate('registrations.user', 'fullName email');
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, event });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
};

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const event = await Event.create({ ...req.body, host: req.body.host ?? user?.id });
    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to create event' });
  }
};

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to update event' });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
};

export const registerForEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    if (!event.isPublished) {
      res.status(400).json({ success: false, message: 'Event is not open for registration' });
      return;
    }
    const alreadyRegistered = event.registrations.some((r) => String(r.user) === user?.id);
    if (alreadyRegistered) {
      res.status(400).json({ success: false, message: 'Already registered for this event' });
      return;
    }
    if (event.maxAttendees && event.registrations.filter((r) => r.status === 'registered').length >= event.maxAttendees) {
      res.status(400).json({ success: false, message: 'Event is fully booked' });
      return;
    }
    event.registrations.push({ user: user?.id as unknown as import('mongoose').Types.ObjectId, status: 'registered', registeredAt: new Date() });
    await event.save();
    res.json({ success: true, message: 'Registered successfully', event });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to register' });
  }
};

export const cancelEventRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    const reg = event.registrations.find((r) => String(r.user) === user?.id);
    if (!reg) {
      res.status(404).json({ success: false, message: 'Registration not found' });
      return;
    }
    reg.status = 'cancelled';
    await event.save();
    res.json({ success: true, message: 'Registration cancelled' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to cancel registration' });
  }
};
