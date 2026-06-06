import mongoose from 'mongoose';
import type { ApprovalStatus, AuthenticatedUser, CrewAvailability, UserRole } from '../types/auth';

const userRoles: UserRole[] = ['client', 'admin', 'super_admin', 'crew', 'staff'];
const approvalStatuses: ApprovalStatus[] = ['pending', 'approved', 'rejected', 'suspended'];
const availabilityStatuses: CrewAvailability[] = ['available', 'busy', 'on_project', 'offline'];

const toIdString = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value.toHexString();
  }

  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const result = (value as { toString: () => string }).toString();
    return result === '[object Object]' ? '' : result;
  }

  return '';
};

const normalizeRole = (role: unknown): UserRole => {
  if (typeof role === 'string' && userRoles.includes(role as UserRole)) {
    return role as UserRole;
  }

  return 'client';
};

const normalizeApprovalStatus = (source: Record<string, unknown>): ApprovalStatus => {
  const approvalStatus = source.approvalStatus;

  if (typeof approvalStatus === 'string' && approvalStatuses.includes(approvalStatus as ApprovalStatus)) {
    return approvalStatus as ApprovalStatus;
  }

  if (source.isApproved === true) {
    return 'approved';
  }

  return normalizeRole(source.role) === 'client' ? 'approved' : 'pending';
};

const normalizeAvailability = (availability: unknown): CrewAvailability => {
  if (typeof availability === 'string' && availabilityStatuses.includes(availability as CrewAvailability)) {
    return availability as CrewAvailability;
  }

  return 'offline';
};

const normalizeAssignedProjects = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(toIdString).filter(Boolean);
};

const displayName = (source: Record<string, unknown>): string => {
  const fullName = typeof source.fullName === 'string' ? source.fullName.trim() : '';
  const name = typeof source.name === 'string' ? source.name.trim() : '';
  const firstName = typeof source.firstName === 'string' ? source.firstName.trim() : '';
  const lastName = typeof source.lastName === 'string' ? source.lastName.trim() : '';

  return fullName || name || `${firstName} ${lastName}`.trim();
};

export const serializeUser = (user: Record<string, any>): AuthenticatedUser => {
  const id = toIdString(user._id ?? user.id);
  const approvalStatus = normalizeApprovalStatus(user);

  return {
    id,
    _id: id,
    fullName: displayName(user),
    name: displayName(user),
    email: typeof user.email === 'string' ? user.email : '',
    role: normalizeRole(user.role),
    isApproved: user.isApproved === true || approvalStatus === 'approved',
    isActive: user.isActive !== false,
    approvalStatus,
    availability: normalizeAvailability(user.availability),
    assignedProjects: normalizeAssignedProjects(user.assignedProjects ?? user.projects ?? user.projectIds),
    phone:
      typeof user.phone === 'string'
        ? user.phone
        : typeof user.contactNumber === 'string'
          ? user.contactNumber
          : undefined,
    avatar:
      typeof user.avatar === 'string'
        ? user.avatar
        : typeof user.profileImage === 'string'
          ? user.profileImage
          : undefined,
    department: typeof user.department === 'string' ? user.department : undefined,
    position: typeof user.position === 'string' ? user.position : undefined,
    bio: typeof user.bio === 'string' ? user.bio : undefined,
    isVerified: typeof user.isVerified === 'boolean' ? user.isVerified : undefined,
    approvedBy: user.approvedBy ? toIdString(user.approvedBy) : null,
    approvedAt: user.approvedAt instanceof Date || typeof user.approvedAt === 'string' ? user.approvedAt : null,
    createdAt: user.createdAt instanceof Date ? user.createdAt : undefined,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt : undefined,
  };
};

export const isPrivilegedRole = (role: unknown): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'super_admin';
};

export const isOperationalRole = (role: unknown): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'crew' || normalizedRole === 'staff';
};

export const isValidUserRole = (role: unknown): role is UserRole =>
  typeof role === 'string' && userRoles.includes(role as UserRole);

export const normalizeUserRole = normalizeRole;

export const canManageUsers = (role: unknown): boolean => isPrivilegedRole(role);

export const canViewAllProjects = (role: unknown): boolean => isPrivilegedRole(role);

export const canViewOperationalWork = (role: unknown): boolean => isPrivilegedRole(role) || isOperationalRole(role);

export const normalizeUserApprovalStatus = normalizeApprovalStatus;

export const toUserIdString = toIdString;