import type { Request, Response } from "express";
import CmsPage from "../models/CmsPage";
import type { AuthenticatedRequest } from "../types/auth";

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const getParamValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

export const getPublishedCmsPage = async (req: Request, res: Response) => {
  try {
    const slug = normalizeSlug(getParamValue(req.params.slug));
    if (!slug) {
      return res.status(400).json({ success: false, message: "Invalid slug" });
    }

    const page = await CmsPage.findOne({ slug, isPublished: true }).lean();
    if (!page) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }

    return res.status(200).json({ success: true, page });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch page",
    });
  }
};

export const getAllCmsPages = async (_req: Request, res: Response) => {
  try {
    const pages = await CmsPage.find({}).sort({ updatedAt: -1 }).lean();
    return res.status(200).json({ success: true, count: pages.length, pages });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch pages",
    });
  }
};

export const upsertCmsPage = async (req: Request, res: Response) => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    const { slug, ...updates } = req.body as Record<string, unknown> & {
      slug?: string;
    };

    const normalizedSlug = normalizeSlug(String(slug || req.params.slug || ""));
    if (!normalizedSlug) {
      return res
        .status(400)
        .json({ success: false, message: "Slug is required" });
    }

    const payload = {
      ...updates,
      slug: normalizedSlug,
      updatedBy: authUser.id,
    };

    const page = await CmsPage.findOneAndUpdate(
      { slug: normalizedSlug },
      { $set: payload },
      { upsert: true, new: true, runValidators: true },
    );

    return res.status(200).json({ success: true, page });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to save page",
    });
  }
};

export const deleteCmsPage = async (req: Request, res: Response) => {
  try {
    const slug = normalizeSlug(getParamValue(req.params.slug));
    if (!slug) {
      return res.status(400).json({ success: false, message: "Invalid slug" });
    }

    const deleted = await CmsPage.findOneAndDelete({ slug });
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }

    return res.status(200).json({ success: true, message: "Page deleted" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete page",
    });
  }
};
