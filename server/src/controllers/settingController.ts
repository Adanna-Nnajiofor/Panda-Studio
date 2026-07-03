import type { Request, Response } from "express";
import Setting from "../models/Setting";
import type { AuthenticatedRequest } from "../types/auth";

const authUser = (req: Request) => (req as AuthenticatedRequest).user;
const paramKey = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : (value ?? "")).toLowerCase();

export const getPublicSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await Setting.find({ scope: "public" }).sort({ key: 1 });
    return res
      .status(200)
      .json({ success: true, count: settings.length, settings });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch public settings",
    });
  }
};

export const listSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await Setting.find({}).sort({ scope: 1, key: 1 });
    return res
      .status(200)
      .json({ success: true, count: settings.length, settings });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch settings",
    });
  }
};

export const getSettingByKey = async (req: Request, res: Response) => {
  try {
    const setting = await Setting.findOne({
      key: paramKey(req.params.key),
    });
    if (!setting)
      return res
        .status(404)
        .json({ success: false, message: "Setting not found" });
    return res.status(200).json({ success: true, setting });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch setting",
    });
  }
};

export const upsertSetting = async (req: Request, res: Response) => {
  try {
    const user = authUser(req);
    const key = String(req.body?.key ?? "")
      .trim()
      .toLowerCase();
    if (!key)
      return res
        .status(400)
        .json({ success: false, message: "key is required" });

    const setting = await Setting.findOneAndUpdate(
      { key },
      {
        $set: {
          value: req.body?.value,
          scope: req.body?.scope ?? "system",
          description: req.body?.description,
          updatedBy: user?.id,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    return res.status(200).json({ success: true, setting });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to save setting",
    });
  }
};

export const deleteSetting = async (req: Request, res: Response) => {
  try {
    const setting = await Setting.findOneAndDelete({
      key: paramKey(req.params.key),
    });
    if (!setting)
      return res
        .status(404)
        .json({ success: false, message: "Setting not found" });
    return res.status(200).json({ success: true, message: "Setting deleted" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete setting",
    });
  }
};
