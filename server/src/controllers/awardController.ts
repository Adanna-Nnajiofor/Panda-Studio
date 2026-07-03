import type { Request, Response } from "express";
import Award from "../models/Award";

export const getPublishedAwards = async (_req: Request, res: Response) => {
  try {
    const awards = await Award.find({ isPublished: true }).sort({
      year: -1,
      sortOrder: 1,
      createdAt: -1,
    });
    return res
      .status(200)
      .json({ success: true, count: awards.length, awards });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch awards",
    });
  }
};

export const getAllAwards = async (_req: Request, res: Response) => {
  try {
    const awards = await Award.find({}).sort({
      year: -1,
      sortOrder: 1,
      createdAt: -1,
    });
    return res
      .status(200)
      .json({ success: true, count: awards.length, awards });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch awards",
    });
  }
};

export const createAward = async (req: Request, res: Response) => {
  try {
    const { title, issuer, year } = req.body as {
      title?: string;
      issuer?: string;
      year?: number;
    };
    if (!title?.trim() || !issuer?.trim() || typeof year !== "number") {
      return res.status(400).json({
        success: false,
        message: "title, issuer, and numeric year are required",
      });
    }

    const award = await Award.create(req.body);
    return res.status(201).json({ success: true, award });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create award",
    });
  }
};

export const updateAward = async (req: Request, res: Response) => {
  try {
    const award = await Award.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!award) {
      return res
        .status(404)
        .json({ success: false, message: "Award not found" });
    }

    return res.status(200).json({ success: true, award });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update award",
    });
  }
};

export const deleteAward = async (req: Request, res: Response) => {
  try {
    const award = await Award.findByIdAndDelete(req.params.id);
    if (!award) {
      return res
        .status(404)
        .json({ success: false, message: "Award not found" });
    }

    return res.status(200).json({ success: true, message: "Award deleted" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete award",
    });
  }
};
