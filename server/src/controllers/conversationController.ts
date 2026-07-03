import type { Request, Response } from "express";
import Conversation from "../models/Conversation";
import type { AuthenticatedRequest } from "../types/auth";

const authUser = (req: Request) => (req as AuthenticatedRequest).user;

export const listMyConversations = async (req: Request, res: Response) => {
  try {
    const user = authUser(req);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const conversations = await Conversation.find({ participants: user.id })
      .populate("participants", "fullName email role avatar")
      .sort({ updatedAt: -1 });

    return res
      .status(200)
      .json({ success: true, count: conversations.length, conversations });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch conversations",
      });
  }
};

export const createConversation = async (req: Request, res: Response) => {
  try {
    const user = authUser(req);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const { participantIds, title, isGroup } = req.body as {
      participantIds?: string[];
      title?: string;
      isGroup?: boolean;
    };

    const uniqueParticipants = Array.from(
      new Set([user.id, ...(participantIds ?? [])]),
    );
    if (uniqueParticipants.length < 2) {
      return res
        .status(400)
        .json({
          success: false,
          message: "At least 2 participants are required",
        });
    }

    const conversation = await Conversation.create({
      title,
      isGroup: Boolean(isGroup),
      participants: uniqueParticipants,
      createdBy: user.id,
      messages: [],
    });

    return res.status(201).json({ success: true, conversation });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create conversation",
      });
  }
};

export const getConversationById = async (req: Request, res: Response) => {
  try {
    const user = authUser(req);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const conversation = await Conversation.findById(req.params.id)
      .populate("participants", "fullName email role avatar")
      .populate("messages.author", "fullName email role avatar");

    if (!conversation)
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    if (
      !conversation.participants.some(
        (p) => String(p) === user.id || String((p as any)._id) === user.id,
      )
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.status(200).json({ success: true, conversation });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch conversation",
      });
  }
};

export const sendConversationMessage = async (req: Request, res: Response) => {
  try {
    const user = authUser(req);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const { body, attachments = [] } = req.body as {
      body?: string;
      attachments?: string[];
    };
    if (!body?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Message body is required" });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation)
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    if (!conversation.participants.some((p) => String(p) === user.id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    conversation.messages.push({
      author: user.id as any,
      body: body.trim(),
      attachments,
      sentAt: new Date(),
      readBy: [user.id as any],
    });
    conversation.lastMessageAt = new Date();
    await conversation.save();

    return res.status(201).json({ success: true, conversation });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to send message",
      });
  }
};
