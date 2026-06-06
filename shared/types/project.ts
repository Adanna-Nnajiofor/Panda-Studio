import type { AuthUser, UserSummary } from './user';

export type ProjectStatus =
  | 'draft'
  | 'pending'
  | 'active'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export interface ProjectIdentity {
  _id?: string;
  id?: string;
}

export interface ProjectTimeline {
  createdAt?: string | Date;
  updatedAt?: string | Date;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  dueDate?: string | Date | null;
}

export interface ProjectCrewAssignment {
  crew?: Array<UserSummary | AuthUser | string>;
  crewMembers?: Array<UserSummary | AuthUser | string>;
  leadCrew?: UserSummary | AuthUser | string | null;
}

export interface Project extends ProjectIdentity, ProjectTimeline, ProjectCrewAssignment {
  name?: string;
  title?: string;
  description?: string;
  clientId?: string | null;
  client?: UserSummary | AuthUser | string | null;
  bookingId?: string | null;
  status?: ProjectStatus | string;
  budget?: number | null;
  currency?: string;
  tags?: string[];
}

export type ProjectRecord = Project;
export type ProjectSummary = Project;