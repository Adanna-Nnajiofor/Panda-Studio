/**
 * Seeds the first super admin account for Panda Studio.
 *
 * Usage:
 *   # Set env vars (or they'll be read from .env)
 *   export SUPER_ADMIN_EMAIL=owner@pandastudio.com
 *   export SUPER_ADMIN_PASSWORD=<secure-password>
 *   export SUPER_ADMIN_NAME="Panda Owner"
 *
 *   npx ts-node src/scripts/seedSuperAdmin.ts
 *
 * Safe to re-run — skips if user already exists.
 */
import dotenv from "dotenv";
import { connectDB } from "../config/db";
import User from "../models/User";
import logger from "../utils/logger";

dotenv.config();

const DEFAULT_EMAIL = "owner@pandastudio.com";
const DEFAULT_NAME = "Panda Studio Owner";

async function seed() {
  await connectDB();

  const email =
    (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase() || DEFAULT_EMAIL;
  const rawPassword = process.env.SUPER_ADMIN_PASSWORD || "";
  const name = (process.env.SUPER_ADMIN_NAME || "").trim() || DEFAULT_NAME;

  if (!rawPassword) {
    logger.error(
      "[seed:super-admin] SUPER_ADMIN_PASSWORD environment variable is required.\n" +
        "  Set it before running:\n" +
        '    export SUPER_ADMIN_PASSWORD="your-secure-password"\n' +
        "    npx ts-node src/scripts/seedSuperAdmin.ts",
    );
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    logger.info(
      `[seed:super-admin] Super admin "${email}" already exists — skipping.`,
    );
    process.exit(0);
  }

  const user = await User.create({
    fullName: name,
    email,
    password: rawPassword,
    role: "super_admin",
    isApproved: true,
    isActive: true,
    approvalStatus: "approved",
    availability: "offline",
    assignedProjects: [],
  });

  logger.info(
    `[seed:super-admin] ✅ Super admin created:\n` +
      `  Name:  ${user.fullName}\n` +
      `  Email: ${user.email}\n` +
      `  Role:  ${user.role}\n` +
      `\n  IMPORTANT: Change the password after first login.`,
  );

  process.exit(0);
}

seed().catch((err) => {
  const message = (
    err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  )
    .replace(/[\r\n\t\0]/g, " ")
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
    .slice(0, 500);
  logger.error("[seed:super-admin] Failed:", { error: message });
  process.exit(1);
});
