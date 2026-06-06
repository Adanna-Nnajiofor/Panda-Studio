import type { Request } from 'express';
import type { JwtPayload } from 'jsonwebtoken';

export type UserRole = 'client' | 'admin' | 'super_admin' | 'crew' | 'staff';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type CrewAvailability = 'available' | 'busy' | 'on_project' | 'offline';

export interface AuthenticatedUser {
  id: string;
  _id: string;
  fullName: string;
  name: string;
  email: string;
  role: UserRole;
  isApproved: boolean;
  isActive: boolean;
  approvalStatus: ApprovalStatus;
  availability: CrewAvailability;
  assignedProjects: string[];
  phone?: string;
  avatar?: string;
  department?: string;
  position?: string;
  bio?: string;
  isVerified?: boolean;
  approvedBy?: string | null;
  approvedAt?: string | Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  success: true;
  token: string;
  user: AuthenticatedUser;
}

export interface TokenPayload extends JwtPayload {
  id: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  token?: string;
}

export type AuthRequest = AuthenticatedRequest;