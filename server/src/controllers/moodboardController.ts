import type { Request, Response } from 'express';
import MoodBoard, { type IMoodBoardItem } from '../models/MoodBoard';
import type { AuthenticatedRequest } from '../types/auth';

const getUser = (req: Request) => (req as AuthenticatedRequest).user;

export const getMyMoodBoards = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const boards = await MoodBoard.find({ user: user?.id }).sort({ updatedAt: -1 });
    res.json({ success: true, count: boards.length, boards });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch mood boards' });
  }
};

export const getMoodBoardById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const board = await MoodBoard.findById(req.params.id);
    if (!board) {
      res.status(404).json({ success: false, message: 'Mood board not found' });
      return;
    }
    const isOwner = String(board.user) === user?.id;
    const isShared = board.sharedWith.map(String).includes(user?.id ?? '');
    if (!isOwner && !isShared && !board.isPublic) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    res.json({ success: true, board });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch mood board' });
  }
};

export const createMoodBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const { title, description, project, booking, items, isPublic } = req.body as {
      title: string;
      description?: string;
      project?: string;
      booking?: string;
      items?: unknown[];
      isPublic?: boolean;
    };

    if (!title) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    const board = await MoodBoard.create({
      user: user?.id,
      title,
      description,
      project,
      booking,
      items: (items ?? []) as IMoodBoardItem[],
      isPublic: isPublic ?? false,
    });

    res.status(201).json({ success: true, board });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to create mood board' });
  }
};

export const updateMoodBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const board = await MoodBoard.findById(req.params.id);
    if (!board) {
      res.status(404).json({ success: false, message: 'Mood board not found' });
      return;
    }
    if (String(board.user) !== user?.id) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    const updated = await MoodBoard.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, board: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to update mood board' });
  }
};

export const deleteMoodBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const board = await MoodBoard.findById(req.params.id);
    if (!board) {
      res.status(404).json({ success: false, message: 'Mood board not found' });
      return;
    }
    if (String(board.user) !== user?.id) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    await MoodBoard.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Mood board deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete mood board' });
  }
};

export const addItemToMoodBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const board = await MoodBoard.findById(req.params.id);
    if (!board) {
      res.status(404).json({ success: false, message: 'Mood board not found' });
      return;
    }
    if (String(board.user) !== user?.id) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    board.items.push(req.body);
    await board.save();
    res.json({ success: true, board });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to add item' });
  }
};
