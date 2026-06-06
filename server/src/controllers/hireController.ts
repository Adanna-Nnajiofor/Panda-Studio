import { z } from 'zod';
import HireRequest from '../models/HireRequest';
import User from '../models/User';
import type { AuthRequest } from '../types/auth';

type Response = any;

const createHireSchema = z.object({
  crewId: z.string().min(1),
  message: z.string().min(10),
  proposedRate: z.number().positive().optional(),
  projectId: z.string().optional(),
});

export const createHireRequest = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createHireSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid request', errors: parsed.error.flatten().fieldErrors });
    }

    const crew = await User.findOne({
      _id: parsed.data.crewId,
      role: 'crew',
      approvalStatus: 'approved',
      isActive: true,
    });
    if (!crew) return res.status(404).json({ message: 'Crew member not found' });

    const hire = await HireRequest.create({
      client: req.user!.id,
      crew: parsed.data.crewId,
      message: parsed.data.message,
      proposedRate: parsed.data.proposedRate,
      project: parsed.data.projectId,
    });

    const populated = await HireRequest.findById(hire._id)
      .populate('crew', 'fullName email department position bio availability')
      .populate('client', 'fullName email');

    return res.status(201).json({ message: 'Hire request sent', hire: populated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getMyHireRequests = async (req: AuthRequest, res: Response) => {
  try {
    const filter =
      req.user!.role === 'crew'
        ? { crew: req.user!.id }
        : { client: req.user!.id };

    const hires = await HireRequest.find(filter)
      .populate('crew', 'fullName email department position bio availability')
      .populate('client', 'fullName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ hires });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const respondToHireRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body as { status?: 'accepted' | 'declined' };
    if (!status || !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'status must be accepted or declined' });
    }

    const hire = await HireRequest.findById(req.params.id);
    if (!hire) return res.status(404).json({ message: 'Request not found' });

    if (req.user!.role === 'crew' && hire.crew.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    hire.status = status;
    await hire.save();

    const populated = await HireRequest.findById(hire._id)
      .populate('crew', 'fullName email')
      .populate('client', 'fullName email');

    return res.status(200).json({ hire: populated });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
