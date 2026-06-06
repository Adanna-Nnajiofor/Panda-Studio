import type { Request, Response } from "express";
import Booking from "../models/Booking";
import Payment from "../models/Payment";
import User from "../models/User";
import HireRequest from "../models/HireRequest";
import Review from "../models/Review";

// Revenue summary - last 6 months
export const getRevenueAnalytics = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueByMonth = await Payment.aggregate([
      { $match: { status: "success", createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const bookingsByMonth = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const totalRevenue = await Payment.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      success: true,
      revenueByMonth,
      bookingsByMonth,
      totalRevenue: totalRevenue[0]?.total ?? 0,
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch revenue analytics" });
  }
};

// Platform overview stats
export const getPlatformStats = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [
      totalUsers,
      totalClients,
      totalCrew,
      totalStaff,
      totalBookings,
      confirmedBookings,
      completedBookings,
      pendingBookings,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "client", isActive: true }),
      User.countDocuments({ role: "crew", isActive: true }),
      User.countDocuments({ role: "staff", isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "pending" }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalClients,
        totalCrew,
        totalStaff,
        totalBookings,
        confirmedBookings,
        completedBookings,
        pendingBookings,
      },
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch platform stats" });
  }
};

// Client Lifetime Value
export const getClientLTV = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const clientLTV = await Payment.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: "$user",
          totalSpent: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
          firstTransaction: { $min: "$createdAt" },
          lastTransaction: { $max: "$createdAt" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          totalSpent: 1,
          transactionCount: 1,
          firstTransaction: 1,
          lastTransaction: 1,
          "user.fullName": 1,
          "user.email": 1,
          "user.avatar": 1,
        },
      },
    ]);

    res.json({ success: true, count: clientLTV.length, clients: clientLTV });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch client LTV" });
  }
};

// Crew performance
export const getCrewPerformance = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const crewPerformance = await Review.aggregate([
      { $match: { revieweeRole: "crew" } },
      {
        $group: {
          _id: "$reviewee",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          avgRating: { $round: ["$avgRating", 1] },
          totalReviews: 1,
          "user.fullName": 1,
          "user.position": 1,
          "user.avatar": 1,
          "user.availability": 1,
        },
      },
    ]);

    res.json({
      success: true,
      count: crewPerformance.length,
      crew: crewPerformance,
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch crew performance" });
  }
};

// Booking trends
export const getBookingTrends = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trends = await Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, trends });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch booking trends" });
  }
};
