import type { Response } from "express";
import Course from "../models/Course";
import Enrollment from "../models/Enrollment";
import AcademySubscription from "../models/AcademySubscription";
import type { AuthRequest } from "../types/auth";

export const enrollInCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.body as { courseId?: string };
    if (!courseId) {
      return res
        .status(400)
        .json({ success: false, message: "courseId is required" });
    }

    const course = await Course.findById(courseId).select(
      "_id isPublished pricingType",
    );
    if (!course || !course.isPublished) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (course.pricingType === "paid") {
      return res.status(402).json({
        success: false,
        message:
          "This is a paid course. Payment unlock will be enabled in the next academy phase.",
      });
    }

    if (course.pricingType === "membership") {
      const now = new Date();
      const activeSubscription = await AcademySubscription.findOne({
        user: req.user!.id,
        status: "active",
        $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
      }).select("_id");

      if (!activeSubscription) {
        return res.status(402).json({
          success: false,
          message:
            "This course requires an active membership. Subscribe to continue.",
        });
      }
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { user: req.user!.id, course: course._id },
      {
        $setOnInsert: {
          user: req.user!.id,
          course: course._id,
          accessType:
            course.pricingType === "membership" ? "membership" : "free",
          status: "active",
          enrolledAt: new Date(),
        },
        $set: { lastAccessedAt: new Date() },
      },
      { new: true, upsert: true },
    );

    return res.status(200).json({ success: true, enrollment });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to enroll in course",
    });
  }
};

export const getMyEnrollments = async (req: AuthRequest, res: Response) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user!.id })
      .populate({
        path: "course",
        select:
          "title slug summary coverImage level pricingType price currency isPublished",
        populate: { path: "category", select: "name slug" },
      })
      .sort({ updatedAt: -1 });

    return res
      .status(200)
      .json({ success: true, count: enrollments.length, enrollments });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch enrollments",
    });
  }
};

export const getMyEnrollmentById = async (req: AuthRequest, res: Response) => {
  try {
    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      user: req.user!.id,
    }).populate({
      path: "course",
      select:
        "title slug summary description coverImage level pricingType price currency",
      populate: { path: "category", select: "name slug" },
    });

    if (!enrollment) {
      return res
        .status(404)
        .json({ success: false, message: "Enrollment not found" });
    }

    return res.status(200).json({ success: true, enrollment });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch enrollment",
    });
  }
};
