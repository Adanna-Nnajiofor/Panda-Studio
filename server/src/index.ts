import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from "./config/db";
import { connectRedis } from "./config/redis";

// Routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import serviceRoutes from "./routes/serviceRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import projectRoutes from "./routes/projectRoutes";
import paymentApiRoutes from "./routes/paymentApiRoutes";
import equipmentRoutes from "./routes/equipmentRoutes";
import fileRoutes from "./routes/fileRoutes";
import rentalRoutes from "./routes/rentalRoutes";
import hireRoutes from "./routes/hireRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import messageRoutes from "./routes/messageRoutes";
import moodboardRoutes from "./routes/moodboardRoutes";
import quoteRoutes from "./routes/quoteRoutes";
import portfolioRoutes from "./routes/portfolioRoutes";
import eventRoutes from "./routes/eventRoutes";
import referralRoutes from "./routes/referralRoutes";
import blogRoutes from "./routes/blogRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import aiRoutes from "./routes/aiRoutes";
import searchRoutes from "./routes/searchRoutes";
import cartRoutes from "./routes/cartRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import checkoutRoutes from "./routes/checkoutRoutes";
import crewApplicationRoutes from "./routes/crewApplicationRoutes";
import invoiceRoutes from "./routes/invoiceRoutes";
import waitlistRoutes from "./routes/waitlistRoutes";
import cmsRoutes from "./routes/cmsRoutes";
import studioRoomRoutes from "./routes/studioRoomRoutes";
import auditLogRoutes from "./routes/auditLogRoutes";
import contractRoutes from "./routes/contractRoutes";
import calendarEventRoutes from "./routes/calendarEventRoutes";
import filmOpsRoutes from "./routes/filmOpsRoutes";
import conversationRoutes from "./routes/conversationRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import availabilityScheduleRoutes from "./routes/availabilityScheduleRoutes";
import faqRoutes from "./routes/faqRoutes";
import settingRoutes from "./routes/settingRoutes";
import equipmentBookingRoutes from "./routes/equipmentBookingRoutes";
import studioBookingRoutes from "./routes/studioBookingRoutes";
import awardRoutes from "./routes/awardRoutes";

import { listCrewDirectory } from "./controllers/crewDirectoryController";
import { protect } from "./middleware/authMiddleware";
import { errorMiddleware } from "./middleware/errorMiddleware";
import logger from "./utils/logger";

// Load env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

// Connect DB + Redis
connectDB();
connectRedis();

/* ─── CORS ─────────────────────────────────────────────────────────────────── */
const parseAllowedOrigins = (): Set<string> => {
  const origins = new Set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://panda-studio-beta.vercel.app",
  ]);
  const raw = process.env.CLIENT_ORIGIN ?? "";
  for (const entry of raw.split(",")) {
    const trimmed = entry.trim().replace(/\/$/, "");
    if (trimmed) origins.add(trimmed);
  }
  return origins;
};

const isAllowedOrigin = (origin: string): boolean => {
  const normalized = origin.replace(/\/$/, "");
  if (!normalized) return false;
  if (parseAllowedOrigins().has(normalized)) return true;
  return /^(https:\/\/)[a-z0-9-]+(\.vercel\.app|\.vercel\.dev)$/i.test(
    normalized,
  );
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, "");
      if (isAllowedOrigin(normalized)) return callback(null, true);
      logger.warn("CORS blocked origin", { origin: normalized });
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  }),
);

/* ─── Core middleware ───────────────────────────────────────────────────────── */
app.use(express.json());

/* ─── Routes ────────────────────────────────────────────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects/:projectId/files", fileRoutes);
app.use("/api/payment", paymentApiRoutes);
app.use("/api/payments", paymentApiRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/hire", hireRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/moodboards", moodboardRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/portfolios", portfolioRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/crew-applications", crewApplicationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/studio-rooms", studioRoomRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/calendar/events", calendarEventRoutes);
app.use("/api/film-ops", filmOpsRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/availability-schedules", availabilityScheduleRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/equipment-bookings", equipmentBookingRoutes);
app.use("/api/studio-bookings", studioBookingRoutes);
app.use("/api/awards", awardRoutes);

// Crew directory
app.get("/api/users/crew", protect(), listCrewDirectory);

// Health check
app.get("/", (_req, res) => res.send("Panda Studio API is running!"));

/* ─── Error handler ─────────────────────────────────────────────────────────── */
app.use(errorMiddleware);

/* ─── Start server ──────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
