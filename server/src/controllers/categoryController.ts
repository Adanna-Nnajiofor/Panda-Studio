import type { Request, Response } from "express";
import Category from "../models/Category";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const listCategories = async (req: Request, res: Response) => {
  try {
    const { type, active = "true" } = req.query as Record<string, string>;
    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (active === "true") query.isActive = true;

    const categories = await Category.find(query).sort({ name: 1 });
    return res
      .status(200)
      .json({ success: true, count: categories.length, categories });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch categories",
    });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, type, description } = req.body as {
      name?: string;
      type?: string;
      description?: string;
    };
    if (!name?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });

    const category = await Category.create({
      name: name.trim(),
      slug: slugify(name),
      type:
        type === "equipment" ||
        type === "service" ||
        type === "blog" ||
        type === "general"
          ? type
          : "general",
      description,
    });

    return res.status(201).json({ success: true, category });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create category",
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const updates = { ...req.body } as Record<string, unknown>;
    if (typeof updates.name === "string") updates.slug = slugify(updates.name);

    const category = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    return res.status(200).json({ success: true, category });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update category",
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    return res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete category",
    });
  }
};
