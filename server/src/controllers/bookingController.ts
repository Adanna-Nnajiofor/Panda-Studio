type Response = any;
import { z } from "zod";
import Booking from "../models/Booking";
import Equipment from "../models/Equipment";
import User from "../models/User";
import { AuthRequest } from "../types/auth";
import { sendNotification } from "../services/notificationService";

// Zod schema for input validation
const bookingSchema = z.object({
  service: z.string().nonempty(),
  equipment: z.array(z.string()).optional(),
  bookingDate: z.string().nonempty(),
  bookingTime: z.string().nonempty(),
  duration: z.number().positive(),
  totalAmount: z.number().positive(),
  notes: z.string().optional(),
});

// ================= CREATE BOOKING =================
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = bookingSchema.safeParse(req.body);

    if (!parsed.success) {
      const formattedErrors = parsed.error.flatten();
      return res.status(400).json({
        message: "Invalid input",
        errors: formattedErrors.fieldErrors,
      });
    }

    const {
      service,
      equipment,
      bookingDate,
      bookingTime,
      duration,
      totalAmount,
      notes,
    } = parsed.data;

    const date = new Date(bookingDate);

    const baseConflictFilter: any = {
      bookingDate: date,
      bookingTime,
      status: { $nin: ["cancelled"] },
    };

    const conflict = await Booking.findOne(baseConflictFilter).or([
      { service },
      { equipment: { $in: equipment || [] } },
    ]);

    if (conflict) {
      return res.status(409).json({
        message:
          "One or more selected items are already booked at this time. Please choose a different slot.",
      });
    }

    if (equipment?.length) {
      const equipmentBookings = await Booking.find(baseConflictFilter)
        .where("equipment")
        .in(equipment);

      const bookedCountByEquipment = equipmentBookings.reduce(
        (acc, bookingItem) => {
          bookingItem.equipment?.forEach((item) => {
            const key = item.toString();
            acc[key] = (acc[key] || 0) + 1;
          });
          return acc;
        },
        {} as Record<string, number>,
      );

      const equipmentRecords = await Equipment.find({
        _id: { $in: equipment },
      });

      const unavailable = equipmentRecords.find(
        (item) => bookedCountByEquipment[item._id.toString()] >= item.quantity,
      );

      if (unavailable) {
        return res.status(409).json({
          message: `Equipment '${unavailable.name}' is fully booked for the selected slot.`,
        });
      }
    }

    const booking = await Booking.create({
      user: req.user!.id,
      service,
      equipment,
      bookingDate: date,
      bookingTime,
      duration,
      totalAmount,
      notes,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("service")
      .populate("project");

    const currentUser = await User.findById(req.user!.id).select(
      "fullName email",
    );

    if (currentUser) {
      await sendNotification({
        type: "booking_confirmed",
        email: currentUser.email,
        booking: populatedBooking as any,
        userName: currentUser.fullName,
      });
    }

    res.status(201).json({
      message: "Booking created successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ================= GET USER BOOKINGS =================
export const getUserBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ user: req.user!.id })
      .populate("service")
      .populate("equipment")
      .populate("project")
      .sort({ bookingDate: -1 });

    res.status(200).json({ bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ================= GET BOOKING BY ID =================
export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("service")
      .populate("equipment")
      .populate("project");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Ensure user can only access their own booking (unless admin)
    if (
      req.user!.role === "client" &&
      booking.user.toString() !== req.user!.id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.status(200).json({ booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ================= UPDATE BOOKING STATUS =================
const updateStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
  ]),
});

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      const formattedErrors = parsed.error.flatten();
      return res.status(400).json({
        message: "Invalid input",
        errors: formattedErrors.fieldErrors,
      });
    }

    const { status } = parsed.data;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only admin/super_admin can update status, or the service provider
    if (req.user!.role === "client") {
      return res
        .status(403)
        .json({ message: "Unauthorized to update booking status" });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("service")
      .populate("project");

    res.status(200).json({
      message: `Booking status updated from ${oldStatus} to ${status}`,
      booking: populatedBooking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ================= GET ALL BOOKINGS (ADMIN) =================
export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    // Only admin/super_admin can view all bookings
    if (!["admin", "super_admin"].includes(req.user!.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.bookingDate = {
        $gte: new Date(String(startDate)),
        $lte: new Date(String(endDate)),
      };
    }

    const bookings = await Booking.find(filter)
      .populate("user", "name email phone")
      .populate("service", "name price")
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      bookings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ================= CANCEL BOOKING =================
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Client can only cancel their own booking
    if (
      req.user!.role === "client" &&
      booking.user.toString() !== req.user!.id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    if (["in_progress", "completed"].includes(booking.status)) {
      return res.status(400).json({
        message: `Cannot cancel a booking that is ${booking.status}`,
      });
    }

    booking.status = "cancelled";
    if (booking.paymentStatus !== "unpaid") {
      booking.paymentStatus = "refunded";
    }
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("service")
      .populate("project");

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
