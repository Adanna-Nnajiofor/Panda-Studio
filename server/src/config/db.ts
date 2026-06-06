import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config();

const ALLOWED_MONGO_SCHEMES = ["mongodb:", "mongodb+srv:"];

const validateMongoURI = (uri: string): string => {
  let parsed: URL;

  try {
    parsed = new URL(uri);
  } catch {
    throw new Error("[db] MONGO_URI is not a valid URL.");
  }

  if (!ALLOWED_MONGO_SCHEMES.includes(parsed.protocol)) {
    throw new Error(
      `[db] MONGO_URI scheme "${parsed.protocol}" is not allowed. Must be mongodb: or mongodb+srv:.`,
    );
  }

  return uri;
};

export const connectDB = async () => {
  const rawURI = process.env.MONGO_URI;

  if (!rawURI) {
    logger.error("[db] MONGO_URI environment variable is not set.");
    process.exit(1);
  }

  try {
    const uri = validateMongoURI(rawURI);
    await mongoose.connect(uri);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("MongoDB connection error", { error });
    process.exit(1);
  }
};
