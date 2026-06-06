import type { Request, Response } from 'express';
import { z } from 'zod';
import File from '../models/File';
import Project from '../models/Project';
import type { AuthenticatedRequest } from '../types/auth';
import { isOperationalRole, isPrivilegedRole } from '../utils/user';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

const createFileSchema = z.object({
  fileUrl: z.string().url(),
  fileType: z.enum(['image', 'video', 'audio', 'document']),
  fileSize: z.number().positive(),
  label: z.string().min(1).optional(),
  isWatermarked: z.boolean().optional(),
  expiresAt: z.string().optional(),
});

const getAuthUser = (req: Request) => (req as AuthenticatedRequest).user;

const canAccessProject = async (
  projectId: string,
  user: NonNullable<AuthenticatedRequest['user']>,
): Promise<boolean> => {
  const project = await Project.findById(projectId).lean();
  if (!project) return false;
  if (isPrivilegedRole(user.role)) return true;

  if (user.role === 'client') {
    return String(project.client) === user.id || String(project.createdBy ?? '') === user.id;
  }

  if (isOperationalRole(user.role)) {
    const crew = (project.assignedCrew ?? []).map(String);
    const staff = (project.assignedStaff ?? []).map(String);
    const users = (project.assignedUsers ?? []).map(String);
    return [...crew, ...staff, ...users].includes(user.id);
  }

  return false;
};

const getProjectId = (req: Request): string | undefined => {
  const { projectId } = req.params;
  return Array.isArray(projectId) ? projectId[0] : projectId;
};

export const listProjectFiles = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const projectId = getProjectId(req);
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const allowed = await canAccessProject(projectId, authUser);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const files = await File.find({ project: projectId }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, files });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to list files',
    });
  }
};

export const addProjectFile = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const isClientReference =
      authUser.role === 'client' && req.body?.isClientReference === 'true';

    if (
      !isPrivilegedRole(authUser.role) &&
      !isOperationalRole(authUser.role) &&
      !isClientReference
    ) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const parsed = createFileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file payload',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const projectId = getProjectId(req);
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const expiresAt = parsed.data.expiresAt
      ? new Date(parsed.data.expiresAt)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const file = await File.create({
      project: project._id,
      uploadedBy: authUser.id,
      fileUrl: parsed.data.fileUrl,
      fileType: parsed.data.fileType,
      fileSize: parsed.data.fileSize,
      label: parsed.data.label,
      isWatermarked: parsed.data.isWatermarked ?? false,
      expiresAt,
    });

    return res.status(201).json({ success: true, file });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add file',
    });
  }
};

function inferFileType(mime: string): 'image' | 'video' | 'audio' | 'document' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
}

export const uploadProjectFile = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const projectId = getProjectId(req);
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const allowed = await canAccessProject(projectId, authUser);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { file } = req;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Multer → req.file.buffer → Cloudinary Upload Helper → Cloudinary Storage
    const uploaded = await uploadToCloudinary(file.buffer, file.mimetype, {
      folder: `panda-studio/projects/${project._id}`,
    });
    const fileUrl = uploaded.url;

    const label =
      typeof req.body?.label === 'string' && req.body.label.trim()
        ? req.body.label.trim()
        : file.originalname;

    const isWatermarked =
      authUser.role === 'client' ? true : req.body?.isWatermarked === 'true';

    const record = await File.create({
      project: project._id,
      uploadedBy: authUser.id,
      fileUrl,
      fileType: inferFileType(file.mimetype),
      fileSize: file.size,
      label,
      isWatermarked,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    return res.status(201).json({ success: true, file: record });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed',
    });
  }
};

export const recordFileDownload = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const allowed = await canAccessProject(String(file.project), authUser);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    file.downloadCount += 1;
    await file.save();

    return res.status(200).json({
      success: true,
      fileUrl: file.fileUrl,
      downloadCount: file.downloadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to record download',
    });
  }
};
