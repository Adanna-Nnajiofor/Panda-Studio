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

/* -----------------------------
    CORS (FIXED & SIMPLE)
------------------------------ */
const allowedOrigins = [
  "http://localhost:3000",
  "https://panda-studio-beta.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow Postman / server-to-server
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

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

/* -----------------------------
   CORE MIDDLEWARES
------------------------------ */
app.use(express.json());

/* -----------------------------
   ROUTES
------------------------------ */
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

// protected route
app.get("/api/users/crew", protect(), listCrewDirectory);

// health check
app.get("/", (_req, res) => {
  res.send("Panda Studio API is running!");
});

/* -----------------------------
   ERROR HANDLER
------------------------------ */
app.use(errorMiddleware);

/* -----------------------------
   START SERVER
------------------------------ */
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
