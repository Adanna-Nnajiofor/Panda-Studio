import { z } from "zod";
import type { Response } from "express";
import Message from "../models/Message";
import Project from "../models/Project";
import type { AuthRequest } from "../types/auth";
import User from "../models/User";
import { pushToUser } from "../utils/sseHub";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";

const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  projectId: z.string().optional(),
  message: z.string().min(1).max(5000),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        fileName: z.string().max(255).optional(),
        mimeType: z.string().max(255).optional(),
        size: z.number().int().nonnegative().optional(),
      }),
    )
    .max(10)
    .optional(),
});

const conversationQuerySchema = z.object({
  otherUserId: z.string().min(1),
  projectId: z.string().optional(),
});

const markReadSchema = z.object({
  otherUserId: z.string().min(1),
  projectId: z.string().optional(),
});

const uploadAttachmentsSchema = z.object({
  receiverId: z.string().min(1),
  projectId: z.string().optional(),
});

const canMessageUser = async (
  senderId: string,
  receiverId: string,
  projectId?: string,
) => {
  // Admin/super_admin can message anyone (but we don't pass roles here; caller already protects)

  if (!projectId) {
    // At minimum require both users exist
    const [sender, receiver] = await Promise.all([
      User.findById(senderId).select("_id role"),
      User.findById(receiverId).select("_id role"),
    ]);
    if (!sender || !receiver) return false;

    // Basic: client can message crew/staff if they are on any project with the client? Not stored here.
    // We'll permit if they share at least one common project when projectId not provided.
    const commonProject = await Project.findOne({
      $or: [
        { client: senderId, assignedUsers: receiverId },
        { client: receiverId, assignedUsers: senderId },
      ],
    }).select("_id");

    return Boolean(commonProject);
  }

  const project = await Project.findById(projectId).select(
    "client assignedCrew assignedStaff assignedUsers",
  );
  if (!project) return false;

  const allowedUserIds = new Set<string>([
    String(project.client),
    ...((project.assignedCrew ?? []) as any[]).map((x) => String(x)),
    ...((project.assignedStaff ?? []) as any[]).map((x) => String(x)),
    ...((project.assignedUsers ?? []) as any[]).map((x) => String(x)),
  ]);

  return allowedUserIds.has(senderId) && allowedUserIds.has(receiverId);
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid message payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const sender = req.user;
    if (!sender) return res.status(401).json({ message: "Unauthorized" });

    const { receiverId, projectId, message, attachments } = parsed.data;

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists)
      return res.status(404).json({ message: "Receiver not found" });

    const allowed = await canMessageUser(sender.id, receiverId, projectId);
    if (!allowed && !["admin", "super_admin"].includes(sender.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const msg = await Message.create({
      sender: sender._id,
      receiver: receiverId,
      project: projectId,
      message,
      attachments: attachments ?? [],
    });

    const populated = await Message.findById(msg._id)
      .populate("sender", "fullName avatar role")
      .populate("receiver", "fullName avatar role")
      .populate("project", "_id progressStatus");

    // Push real-time event to receiver
    pushToUser(receiverId, "new_message", populated);

    return res.status(201).json({ message: "Sent", msg: populated });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};

export const listConversation = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = conversationQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid query",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const sender = req.user;
    if (!sender) return res.status(401).json({ message: "Unauthorized" });

    const { otherUserId, projectId } = parsed.data;

    const allowed = await canMessageUser(sender.id, otherUserId, projectId);
    if (!allowed && !["admin", "super_admin"].includes(sender.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const messages = await Message.find({
      sender: { $in: [sender._id, otherUserId] },
      receiver: { $in: [sender._id, otherUserId] },
      ...(projectId ? { project: projectId } : {}),
    })
      .sort({ createdAt: 1 })
      .populate("sender", "fullName avatar role")
      .populate("receiver", "fullName avatar role")
      .populate("project", "_id progressStatus");

    // Mark as read is handled by separate endpoint
    return res.status(200).json({ messages });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};

export const markConversationRead = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = markReadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const viewer = req.user;
    if (!viewer) return res.status(401).json({ message: "Unauthorized" });

    const { otherUserId, projectId } = parsed.data;

    const allowed = await canMessageUser(viewer.id, otherUserId, projectId);
    if (!allowed && !["admin", "super_admin"].includes(viewer.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const filter: any = {
      receiver: viewer._id,
      sender: otherUserId,
      isRead: false,
      ...(projectId ? { project: projectId } : {}),
    };

    await Message.updateMany(filter, { $set: { isRead: true } });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};

export const uploadMessageAttachments = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const parsed = uploadAttachmentsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid upload payload",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const sender = req.user;
    if (!sender) return res.status(401).json({ message: "Unauthorized" });

    const { receiverId, projectId } = parsed.data;
    const allowed = await canMessageUser(sender.id, receiverId, projectId);
    if (!allowed && !["admin", "super_admin"].includes(sender.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploaded = await Promise.allSettled(
      files.map(async (file) => {
        const result = await uploadToCloudinary(file.buffer, file.mimetype, {
          folder: `panda-studio/messages/${sender.id}`,
        });
        return {
          url: result.url,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        };
      }),
    );

    const attachments = uploaded
      .filter((entry) => entry.status === "fulfilled")
      .map(
        (entry) =>
          (
            entry as PromiseFulfilledResult<{
              url: string;
              fileName: string;
              mimeType: string;
              size: number;
            }>
          ).value,
      );

    if (attachments.length === 0) {
      return res.status(500).json({ message: "All uploads failed" });
    }

    return res.status(200).json({
      message: "Attachments uploaded",
      attachments,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};
