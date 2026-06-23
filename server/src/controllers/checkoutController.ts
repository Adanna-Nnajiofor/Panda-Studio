import { z } from "zod";
import type { Response } from "express";
import Equipment from "../models/Equipment";
import Booking from "../models/Booking";
import Cart from "../models/Cart";
import Service from "../models/Service";
import { AuthRequest } from "../types/auth";
import CheckoutIdVerification from "../models/CheckoutIdVerification";
import { sendNotification } from "../services/notificationService";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

// uploadToCloudinary uploads a file buffer to Cloudinary.

const verifyIdSchema = z.object({
  // draft fields allow us to store what confirm will use
  service: z.string().min(1),
  equipment: z.array(z.string()).optional(),
  bookingDate: z.string().nonempty(),
  bookingTime: z.string().nonempty(),
  duration: z.number().positive(),
  totalAmount: z.number().positive(),
  notes: z.string().optional(),
});

const confirmSchema = z.object({
  // for simplicity: confirm last verification for user
});

const validateAvailabilityAndCreateBooking = async (opts: {
  userId: string;
  service: string;
  equipment?: string[];
  bookingDate: string;
  bookingTime: string;
  duration: number;
  totalAmount: number;
  notes?: string;
}) => {
  const date = new Date(opts.bookingDate);

  // Conflict filter (based on existing bookingService logic)
  const baseConflictFilter: any = {
    bookingDate: date,
    bookingTime: opts.bookingTime,
    status: { $nin: ["cancelled"] },
  };

  const conflict = await Booking.findOne(baseConflictFilter).or([
    { service: opts.service },
    { equipment: { $in: opts.equipment || [] } },
  ]);

  if (conflict) {
    return { ok: false as const, message: "Selected slot is already booked" };
  }

  if (opts.equipment?.length) {
    const equipmentBookings = await Booking.find(baseConflictFilter)
      .where("equipment")
      .in(opts.equipment);

    const bookedCountByEquipment = equipmentBookings.reduce(
      (acc, bookingItem: any) => {
        bookingItem.equipment?.forEach((item: any) => {
          const key = item.toString();
          acc[key] = (acc[key] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    const equipmentRecords = await Equipment.find({
      _id: { $in: opts.equipment },
    });

    const unavailable = equipmentRecords.find(
      (item: any) =>
        bookedCountByEquipment[item._id.toString()] >= item.quantity,
    );

    if (unavailable) {
      return {
        ok: false as const,
        message: `Equipment '${unavailable.name}' is fully booked for the selected slot.`,
      };
    }
  }

  const booking = await Booking.create({
    user: opts.userId,
    service: opts.service,
    equipment: opts.equipment,
    bookingDate: date,
    bookingTime: opts.bookingTime,
    duration: opts.duration,
    totalAmount: opts.totalAmount,
    notes: opts.notes,
  });

  const populatedBooking = await Booking.findById(booking._id)
    .populate("service")
    .populate("equipment")
    .populate("project");

  return { ok: true as const, booking: populatedBooking };
};

const verifyIdUpload = async (req: AuthRequest, res: Response) => {
  // Multer/cloudinary file is expected; existing upload middleware is used in routes.
  const parsed = verifyIdSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const existing = await CheckoutIdVerification.findOne({ user: req.user!.id });
  const draft = parsed.data;

  // upload from req.file (or req.files)
  try {
    // Expect req.file from multer middleware
    const file = (req as any).file;
    if (!file) {
      // allow verify without file to keep functional flow
      const verifier =
        existing || new CheckoutIdVerification({ user: req.user!.id });
      verifier.status = "pending";
      verifier.bookingDraft = {
        service: draft.service as any,
        equipment: (draft.equipment || []) as any,
        bookingDate: new Date(draft.bookingDate),
        bookingTime: draft.bookingTime,
        duration: draft.duration,
        totalAmount: draft.totalAmount,
        notes: draft.notes,
      };
      await verifier.save();

      return res.status(200).json({
        success: true,
        status: verifier.status,
        message: "ID not provided; marked pending.",
      });
    }

    // upload ID to cloudinary using helper that accepts buffer from multer
    const uploadResult = await uploadToCloudinary(
      file.buffer,
      file.originalname,
    );

    const verifier =
      existing || new CheckoutIdVerification({ user: req.user!.id });
    verifier.status = "verified";
    verifier.cloudinaryAssetId = uploadResult.assetId;
    verifier.cloudinaryUrl = uploadResult.secureUrl;
    verifier.bookingDraft = {
      service: draft.service as any,
      equipment: (draft.equipment || []) as any,
      bookingDate: new Date(draft.bookingDate),
      bookingTime: draft.bookingTime,
      duration: draft.duration,
      totalAmount: draft.totalAmount,
      notes: draft.notes,
    };

    await verifier.save();

    return res.status(200).json({
      success: true,
      status: verifier.status,
      message: "ID uploaded and verified.",
    });
  } catch (e) {
    const verifier =
      existing || new CheckoutIdVerification({ user: req.user!.id });
    verifier.status = "rejected";
    verifier.rejectionReason = "ID upload failed";
    await verifier.save();

    return res.status(400).json({
      success: false,
      message: "ID upload failed",
    });
  }
};

const confirmCheckout = async (req: AuthRequest, res: Response) => {
  const _parsed = confirmSchema.safeParse(req.body);
  if (!_parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const verifier = await CheckoutIdVerification.findOne({ user: req.user!.id });
  if (!verifier || !verifier.bookingDraft) {
    return res
      .status(400)
      .json({ message: "No ID verification session found" });
  }
  if (verifier.status !== "verified") {
    return res
      .status(400)
      .json({ message: `ID verification not completed (${verifier.status})` });
  }

  const draft = verifier.bookingDraft;
  const result = await validateAvailabilityAndCreateBooking({
    userId: req.user!.id,
    service: String(draft!.service),
    equipment: draft!.equipment?.map(String),
    bookingDate: String(draft!.bookingDate),
    bookingTime: draft!.bookingTime,
    duration: draft!.duration,
    totalAmount: draft!.totalAmount,
    notes: draft!.notes,
  });

  if (!result.ok) {
    return res.status(409).json({ message: result.message });
  }

  // Optional: notify
  try {
    // skip user fetch if not needed
    await sendNotification({
      type: "booking_confirmed",
      email: req.user?.email || "",
      booking: result.booking as any,
      userName: req.user?.fullName || "Customer",
    });
  } catch {
    // ignore notification errors
  }

  // Clear cart after successful booking
  await Cart.findOneAndUpdate({ user: req.user!.id }, { items: [] });

  // Clear verification session to avoid re-confirm
  verifier.status = "pending";
  verifier.bookingDraft = undefined;
  await verifier.save();

  return res.status(201).json({
    success: true,
    booking: result.booking,
  });
};

export { verifyIdUpload, confirmCheckout };
