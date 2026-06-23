import { z } from "zod";
import Equipment from "../models/Equipment";
import EquipmentRental from "../models/EquipmentRental";
import type { AuthRequest } from "../types/auth";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";

type Response = any;

const parseNumber = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : Number(trimmed);
  }
  return value;
}, z.number());

const parseOptionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .preprocess((value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed === "" ? undefined : trimmed;
      }
      return value;
    }, schema)
    .optional();

const createRentalSchema = z.object({
  equipment: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  durationType: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  totalAmount: z.preprocess((value) => {
    if (typeof value === "string") return Number(value);
    return value;
  }, z.number().positive()),
  depositAmount: parseNumber
    .optional()
    .refine((value) => value === undefined || value >= 0, {
      message: "Deposit amount must be 0 or higher",
    }),
  notes: parseOptionalString(z.string()),
  renterName: parseOptionalString(z.string()),
  contactPhone: parseOptionalString(z.string()),
  renterOccupation: parseOptionalString(z.string()),
  renterAddress: parseOptionalString(z.string()),
  renterLocation: parseOptionalString(z.string()),
  productionType: parseOptionalString(z.string()),
  shootPurpose: parseOptionalString(z.string()),
  identityType: parseOptionalString(
    z.enum([
      "NIN",
      "Voters Card",
      "International Passport",
      "Driver License",
      "Other",
    ]),
  ),
  identityNumber: parseOptionalString(z.string()),
  identityDocumentUrl: parseOptionalString(z.string().url()),
  profilePhotoUrl: parseOptionalString(z.string().url()),
});

export const createRental = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createRentalSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid rental data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const equipment = await Equipment.findById(parsed.data.equipment);

    if (!equipment || !equipment.isActive) {
      return res.status(404).json({ message: "Equipment not available" });
    }

    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;

    let identityDocumentUrl: string | undefined;
    let profilePhotoUrl: string | undefined;

    //  SAFE ID UPLOAD
    if (files?.identityDocument?.length) {
      const file = files.identityDocument[0];

      if (file?.buffer) {
        const uploadResult = await uploadToCloudinary(
          file.buffer,
          file.mimetype,
          {
            folder: `panda-studio/rentals/${req.user!.id}/identity`,
          },
        );

        identityDocumentUrl = uploadResult?.url;
      }
    }

    //  SAFE PROFILE PHOTO UPLOAD
    if (files?.profilePhoto?.length) {
      const file = files.profilePhoto[0];

      if (file?.buffer) {
        const uploadResult = await uploadToCloudinary(
          file.buffer,
          file.mimetype,
          {
            folder: `panda-studio/rentals/${req.user!.id}/profile`,
          },
        );

        profilePhotoUrl = uploadResult?.url;
      }
    }

    const rental = await EquipmentRental.create({
      user: req.user!.id,
      equipment: parsed.data.equipment,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      durationType: parsed.data.durationType,
      totalAmount: parsed.data.totalAmount,
      depositAmount:
        parsed.data.depositAmount ?? Math.round(parsed.data.totalAmount * 0.3),

      renterName: parsed.data.renterName,
      contactPhone: parsed.data.contactPhone,
      renterOccupation: parsed.data.renterOccupation,
      renterAddress: parsed.data.renterAddress,
      renterLocation: parsed.data.renterLocation,
      productionType: parsed.data.productionType,
      shootPurpose: parsed.data.shootPurpose,
      identityType: parsed.data.identityType,
      identityNumber: parsed.data.identityNumber,

      identityDocumentUrl,
      profilePhotoUrl,
      notes: parsed.data.notes,
    });

    const populated = await EquipmentRental.findById(rental._id).populate(
      "equipment",
    );

    return res.status(201).json({
      message: "Rental request created",
      rental: populated,
    });
  } catch (error) {
    console.error("CREATE RENTAL ERROR:", {
      message: error instanceof Error ? error.message : error,
      // helpful context (no secrets)
      bodyKeys: req.body ? Object.keys(req.body) : [],
      hasIdentityDocument: Boolean(
        (req.files as any)?.identityDocument?.length,
      ),
      hasProfilePhoto: Boolean((req.files as any)?.profilePhoto?.length),
      identityMime: (req.files as any)?.identityDocument?.[0]?.mimetype,
      profileMime: (req.files as any)?.profilePhoto?.[0]?.mimetype,
    });

    return res.status(500).json({
      message: "Server error",
      error:
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Internal server error",
    });
  }
};

export const getMyRentals = async (req: AuthRequest, res: Response) => {
  try {
    const rentals = await EquipmentRental.find({ user: req.user!.id })
      .populate("equipment")
      .sort({ createdAt: -1 });
    return res.status(200).json({ rentals });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllRentals = async (req: AuthRequest, res: Response) => {
  try {
    if (!["admin", "super_admin", "staff"].includes(req.user!.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const rentals = await EquipmentRental.find()
      .populate("equipment")
      .populate("user", "fullName email")
      .sort({ createdAt: -1 });
    return res.status(200).json({ rentals });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateRentalStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!["admin", "super_admin", "staff"].includes(req.user!.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { status } = req.body as { status?: string };
    const rental = await EquipmentRental.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    ).populate("equipment");
    if (!rental) return res.status(404).json({ message: "Rental not found" });
    return res.status(200).json({ rental });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
