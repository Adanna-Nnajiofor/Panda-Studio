import type { Response } from "express";
import Enrollment from "../models/Enrollment";
import Lesson from "../models/Lesson";
import LessonProgress from "../models/LessonProgress";
import type { AuthRequest } from "../types/auth";

export const upsertLessonProgress = async (req: AuthRequest, res: Response) => {
  try {
    const {
      courseId,
      lessonId,
      status,
      lastPositionSeconds = 0,
    } = req.body as {
      courseId?: string;
      lessonId?: string;
      status?: "not_started" | "in_progress" | "completed";
      lastPositionSeconds?: number;
    };

    if (!courseId || !lessonId || !status) {
      return res.status(400).json({
        success: false,
        message: "courseId, lessonId and status are required",
      });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user!.id,
      course: courseId,
    });
    if (!enrollment) {
      return res
        .status(403)
        .json({ success: false, message: "Enroll in this course first" });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    await LessonProgress.findOneAndUpdate(
      { user: req.user!.id, lesson: lessonId },
      {
        user: req.user!.id,
        course: courseId,
        lesson: lessonId,
        status,
        lastPositionSeconds,
        completedAt: status === "completed" ? new Date() : undefined,
      },
      { upsert: true, new: true },
    );

    const [totalLessons, completedLessons] = await Promise.all([
      Lesson.countDocuments({ course: courseId, isPublished: true }),
      LessonProgress.countDocuments({
        user: req.user!.id,
        course: courseId,
        status: "completed",
      }),
    ]);

    const progressPercent =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    enrollment.progressPercent = progressPercent;
    enrollment.lastAccessedAt = new Date();
    enrollment.status = progressPercent >= 100 ? "completed" : "active";
    if (progressPercent >= 100 && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
    }
    await enrollment.save();

    return res.status(200).json({
      success: true,
      progressPercent,
      completedLessons,
      totalLessons,
      enrollment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to save lesson progress",
    });
  }
};

export const getCourseProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      user: req.user!.id,
      course: courseId,
    });
    if (!enrollment) {
      return res
        .status(404)
        .json({ success: false, message: "Enrollment not found" });
    }

    const [totalLessons, progressItems] = await Promise.all([
      Lesson.countDocuments({ course: courseId, isPublished: true }),
      LessonProgress.find({ user: req.user!.id, course: courseId })
        .select("lesson status lastPositionSeconds completedAt")
        .sort({ updatedAt: -1 }),
    ]);

    const completedLessons = progressItems.filter(
      (item) => item.status === "completed",
    ).length;

    return res.status(200).json({
      success: true,
      enrollment,
      totalLessons,
      completedLessons,
      progressItems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch progress",
    });
  }
};
