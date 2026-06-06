import type { Request, Response } from 'express';
import User from '../models/User';
import type { AuthenticatedRequest } from '../types/auth';
import { serializeUser } from '../utils/user';

export const listCrewDirectory = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const crew = await User.find({
      role: 'crew',
      isActive: true,
      approvalStatus: 'approved',
    })
      .select('fullName email role department position bio availability avatar')
      .sort({ fullName: 1 });

    return res.status(200).json({
      success: true,
      count: crew.length,
      users: crew.map((user) => serializeUser(user.toObject())),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to load crew directory',
    });
  }
};
