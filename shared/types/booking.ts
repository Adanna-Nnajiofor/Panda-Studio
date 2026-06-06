import type { AuthUser, UserSummary } from './user';

export type BookingStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface BookingIdentity {
  _id?: string;
  id?: string;
}

export interface BookingTimeline {
  createdAt?: string | Date;
  updatedAt?: string | Date;
  scheduledAt?: string | Date;
  completedAt?: string | Date;
}

export interface BookingContact {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

export interface BookingCrewAssignment {
  crew?: Array<UserSummary | AuthUser | string>;
  assignedCrew?: Array<UserSummary | AuthUser | string>;
  leadCrew?: UserSummary | AuthUser | string | null;
}

export interface Booking extends BookingIdentity, BookingTimeline, BookingContact, BookingCrewAssignment {
  title?: string;
  description?: string;
  serviceId?: string | null;
  serviceName?: string;
  projectId?: string | null;
  project?: string | null;
  clientId?: string | null;
  client?: UserSummary | AuthUser | string | null;
  status?: BookingStatus | string;
  notes?: string;
  location?: string;
  amount?: number | null;
  currency?: string;
  depositAmount?: number | null;
  balanceDue?: number | null;
}

export type BookingRecord = Booking;
export type BookingSummary = Booking;