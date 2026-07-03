import type { Request, Response } from "express";
import Course from "../models/Course";
import CourseCategory from "../models/CourseCategory";
import CourseModule from "../models/CourseModule";
import Lesson from "../models/Lesson";
import type { AuthenticatedRequest } from "../types/auth";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const isAdminRequest = (req: Request) => {
  const role = (req as AuthenticatedRequest).user?.role;
  return role === "admin" || role === "super_admin";
};

const readParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
};

export const listAcademyCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await CourseCategory.find({ isActive: true }).sort({
      order: 1,
      name: 1,
    });
    return res
      .status(200)
      .json({ success: true, count: categories.length, categories });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch course categories",
    });
  }
};

export const createAcademyCategory = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      order = 0,
    } = req.body as {
      name?: string;
      description?: string;
      order?: number;
    };
    if (!name?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }

    const category = await CourseCategory.create({
      name: name.trim(),
      slug: slugify(name),
      description,
      order,
    });

    return res.status(201).json({ success: true, category });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create course category",
    });
  }
};

export const listAcademyCourses = async (req: Request, res: Response) => {
  try {
    const { category, level, query, includeDrafts } = req.query as Record<
      string,
      string
    >;
    const filter: Record<string, unknown> = {};

    if (!(includeDrafts === "true" && isAdminRequest(req))) {
      filter.isPublished = true;
    }

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (query?.trim()) {
      filter.$or = [
        { title: { $regex: query.trim(), $options: "i" } },
        { summary: { $regex: query.trim(), $options: "i" } },
        { tags: { $in: [new RegExp(query.trim(), "i")] } },
      ];
    }

    const courses = await Course.find(filter)
      .populate("category", "name slug")
      .sort({ isPublished: -1, publishedAt: -1, createdAt: -1 });

    return res
      .status(200)
      .json({ success: true, count: courses.length, courses });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch courses",
    });
  }
};

export const getAcademyCourseById = async (req: Request, res: Response) => {
  try {
    const idOrSlug = readParam(
      req.params.idOrSlug as string | string[] | undefined,
    );
    const filter = idOrSlug.match(/^[a-f\d]{24}$/i)
      ? { _id: idOrSlug }
      : { slug: idOrSlug.toLowerCase() };

    const course = await Course.findOne(filter).populate(
      "category",
      "name slug",
    );
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (!course.isPublished && !isAdminRequest(req)) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    return res.status(200).json({ success: true, course });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch course",
    });
  }
};

export const getAcademyCourseOutline = async (req: Request, res: Response) => {
  try {
    const idOrSlug = readParam(
      req.params.idOrSlug as string | string[] | undefined,
    );
    const filter = idOrSlug.match(/^[a-f\d]{24}$/i)
      ? { _id: idOrSlug }
      : { slug: idOrSlug.toLowerCase() };

    const course = await Course.findOne(filter).select(
      "_id title slug isPublished",
    );
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (!course.isPublished && !isAdminRequest(req)) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const moduleFilter: Record<string, unknown> = { course: course._id };
    const lessonFilter: Record<string, unknown> = { course: course._id };

    if (!isAdminRequest(req)) {
      moduleFilter.isPublished = true;
      lessonFilter.isPublished = true;
    }

    const [modules, lessons] = await Promise.all([
      CourseModule.find(moduleFilter).sort({ order: 1, createdAt: 1 }),
      Lesson.find(lessonFilter)
        .select(
          "_id course module title slug description durationMinutes order isPreview isPublished",
        )
        .sort({ order: 1, createdAt: 1 }),
    ]);

    return res.status(200).json({ success: true, course, modules, lessons });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch course outline",
    });
  }
};

export const createAcademyCourse = async (req: Request, res: Response) => {
  try {
    const { title, summary, category } = req.body as {
      title?: string;
      summary?: string;
      category?: string;
    };

    if (!title?.trim() || !summary?.trim() || !category?.trim()) {
      return res.status(400).json({
        success: false,
        message: "title, summary, and category are required",
      });
    }

    const course = await Course.create({
      ...req.body,
      title: title.trim(),
      slug: slugify(title),
      summary: summary.trim(),
    });

    return res.status(201).json({ success: true, course });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create course",
    });
  }
};

export const updateAcademyCourse = async (req: Request, res: Response) => {
  try {
    const updates = { ...req.body } as Record<string, unknown>;
    if (typeof updates.title === "string") {
      updates.slug = slugify(updates.title);
    }

    const course = await Course.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    return res.status(200).json({ success: true, course });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update course",
    });
  }
};

export const publishAcademyCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isPublished: true, publishedAt: new Date() },
      { new: true },
    );

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    return res.status(200).json({ success: true, course });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to publish course",
    });
  }
};

export const createAcademyModule = async (req: Request, res: Response) => {
  try {
    const { title } = req.body as { title?: string };
    if (!title?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Module title is required" });
    }

    const module = await CourseModule.create({
      ...req.body,
      course: req.params.courseId,
      title: title.trim(),
    });

    return res.status(201).json({ success: true, module });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create module",
    });
  }
};

export const createAcademyLesson = async (req: Request, res: Response) => {
  try {
    const { title, module, course } = req.body as {
      title?: string;
      module?: string;
      course?: string;
    };
    if (!title?.trim() || !module || !course) {
      return res.status(400).json({
        success: false,
        message: "title, module, and course are required",
      });
    }

    const lesson = await Lesson.create({
      ...req.body,
      title: title.trim(),
      slug: slugify(title),
    });

    return res.status(201).json({ success: true, lesson });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create lesson",
    });
  }
};
