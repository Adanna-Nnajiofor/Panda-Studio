export type UserRole = 'client' | 'admin' | 'super_admin' | 'crew' | 'staff';

export type CrewAvailability = 'available' | 'busy' | 'on_project' | 'offline';

export interface EntityId {
  _id?: string;
  id?: string;
}

export interface TimestampedEntity {
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CrewProfileFields {
  availability?: CrewAvailability;
  specialties?: string[];
  skills?: string[];
  currentProjectId?: string | null;
  assignedProjectIds?: string[];
  hourlyRate?: number | null;
  experienceYears?: number | null;
  bio?: string;
  location?: string;
}

export interface AuthUser extends EntityId, TimestampedEntity, CrewProfileFields {
  name: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  role: UserRole;
  isApproved: boolean;
  isActive: boolean;
}

export interface UserSummary extends EntityId {
  name: string;
  email?: string;
  avatar?: string | null;
  role: UserRole;
  isApproved: boolean;
  isActive: boolean;
  availability?: CrewAvailability;
}

export interface Profile extends AuthUser {
  address?: string;
  companyName?: string;
  title?: string;
  website?: string;
  timezone?: string;
  notes?: string;
}

export type UserProfile = Profile;
export type User = AuthUser;
export type AuthenticatedUser = AuthUser;
export type CrewUser = AuthUser;
export type PublicUser = UserSummary;