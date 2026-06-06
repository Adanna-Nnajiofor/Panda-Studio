import type { Request, Response } from 'express';
import Project from '../models/Project';
import type { AuthenticatedRequest } from '../types/auth';
import { isOperationalRole, isPrivilegedRole } from '../utils/user';

const sendNotFound = (res: Response) =>
  res.status(404).json({
    success: false,
    message: 'Project not found',
  });

const getAuthUser = (req: Request) => (req as AuthenticatedRequest).user;

const buildVisibilityFilter = (user: NonNullable<AuthenticatedRequest['user']>) => {
  if (isPrivilegedRole(user.role)) {
    return {};
  }

  if (user.role === 'client') {
    return {
      $or: [{ client: user.id }, { createdBy: user.id }, { assignedUsers: user.id }],
    };
  }

  if (isOperationalRole(user.role)) {
    return {
      $or: [{ assignedCrew: user.id }, { assignedStaff: user.id }, { assignedUsers: user.id }],
    };
  }

  return { _id: { $exists: false } };
};

const isUserAllowedForProject = (user: NonNullable<AuthenticatedRequest['user']>, project: Record<string, any>) => {
  if (isPrivilegedRole(user.role)) {
    return true;
  }

  if (user.role === 'client') {
    return String(project.client?._id ?? project.client) === user.id || String(project.createdBy?._id ?? project.createdBy) === user.id;
  }

  if (isOperationalRole(user.role)) {
    const assignedCrew = Array.isArray(project.assignedCrew) ? project.assignedCrew.map(String) : [];
    const assignedStaff = Array.isArray(project.assignedStaff) ? project.assignedStaff.map(String) : [];
    const assignedUsers = Array.isArray(project.assignedUsers) ? project.assignedUsers.map(String) : [];
    return [...assignedCrew, ...assignedStaff, ...assignedUsers].includes(user.id);
  }

  return false;
};

export const getProjects = async (req: Request, res: Response): Promise<Response> => {
  const authUser = getAuthUser(req);
  const filter = authUser ? buildVisibilityFilter(authUser) : {};
  const projects = await Project.find(filter).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: projects.length,
    projects,
  });
};

export const getMyProjects = async (req: Request, res: Response): Promise<Response | void> => {
  const authUser = getAuthUser(req);

  if (!authUser) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const projects = await Project.find(buildVisibilityFilter(authUser)).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: projects.length,
    projects,
  });
};

export const getProjectById = async (req: Request, res: Response): Promise<Response | void> => {
  const authUser = getAuthUser(req);
  const project = await Project.findById(req.params.id);

  if (!project) {
    return sendNotFound(res);
  }

  if (authUser && !isUserAllowedForProject(authUser, project.toObject())) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this project',
    });
  }

  return res.status(200).json({
    success: true,
    project,
  });
};

export const createProject = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const { booking, client, expiryDate, progressStatus, isArchived } = req.body as {
      booking?: string;
      client?: string;
      expiryDate?: string;
      progressStatus?: 'pre_production' | 'shooting' | 'editing' | 'ready_for_delivery' | 'delivered';
      isArchived?: boolean;
    };

    if (!booking || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'booking and expiryDate are required',
      });
    }

    const project = await Project.create({
      booking,
      client: client ?? authUser.id,
      createdBy: authUser.id,
      expiryDate,
      progressStatus,
      isArchived,
    });

    return res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create project',
    });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return sendNotFound(res);
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update project',
    });
  }
};

export const updateProjectWorkflow = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { progressStatus, isArchived } = req.body as {
      progressStatus?: 'pre_production' | 'shooting' | 'editing' | 'ready_for_delivery' | 'delivered';
      isArchived?: boolean;
    };

    const updates: Record<string, unknown> = {};

    if (typeof progressStatus === 'string') {
      updates.progressStatus = progressStatus;
    }

    if (typeof isArchived === 'boolean') {
      updates.isArchived = isArchived;
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return sendNotFound(res);
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update project workflow',
    });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<Response | void> => {
  const project = await Project.findByIdAndDelete(req.params.id);

  if (!project) {
    return sendNotFound(res);
  }

  return res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
  });
};

export const assignProjectMembers = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { crewIds, staffIds, userIds } = req.body as {
      crewIds?: string[];
      staffIds?: string[];
      userIds?: string[];
    };

    const updates: Record<string, unknown> = {};

    if (Array.isArray(crewIds)) {
      updates.assignedCrew = crewIds;
    }

    if (Array.isArray(staffIds)) {
      updates.assignedStaff = staffIds;
    }

    if (Array.isArray(userIds)) {
      updates.assignedUsers = userIds;
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return sendNotFound(res);
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to assign project members',
    });
  }
};