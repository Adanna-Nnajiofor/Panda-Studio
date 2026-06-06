import { z } from 'zod';
import Equipment from '../models/Equipment';
import EquipmentRental from '../models/EquipmentRental';
import type { AuthRequest } from '../types/auth';

type Response = any;

const createRentalSchema = z.object({
  equipment: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  durationType: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  totalAmount: z.number().positive(),
  depositAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export const createRental = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createRentalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid rental data', errors: parsed.error.flatten().fieldErrors });
    }

    const equipment = await Equipment.findById(parsed.data.equipment);
    if (!equipment || !equipment.isActive) {
      return res.status(404).json({ message: 'Equipment not available' });
    }

    const rental = await EquipmentRental.create({
      user: req.user!.id,
      equipment: parsed.data.equipment,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      durationType: parsed.data.durationType,
      totalAmount: parsed.data.totalAmount,
      depositAmount: parsed.data.depositAmount ?? Math.round(parsed.data.totalAmount * 0.3),
      notes: parsed.data.notes,
    });

    const populated = await EquipmentRental.findById(rental._id).populate('equipment');
    return res.status(201).json({ message: 'Rental request created', rental: populated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getMyRentals = async (req: AuthRequest, res: Response) => {
  try {
    const rentals = await EquipmentRental.find({ user: req.user!.id })
      .populate('equipment')
      .sort({ createdAt: -1 });
    return res.status(200).json({ rentals });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getAllRentals = async (req: AuthRequest, res: Response) => {
  try {
    if (!['admin', 'super_admin', 'staff'].includes(req.user!.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const rentals = await EquipmentRental.find()
      .populate('equipment')
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 });
    return res.status(200).json({ rentals });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateRentalStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!['admin', 'super_admin', 'staff'].includes(req.user!.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { status } = req.body as { status?: string };
    const rental = await EquipmentRental.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    ).populate('equipment');
    if (!rental) return res.status(404).json({ message: 'Rental not found' });
    return res.status(200).json({ rental });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
