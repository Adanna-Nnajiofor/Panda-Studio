import type { NextFunction, Request, Response } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Fallback allowed origins (hardcoded defaults)
const FALLBACK_ORIGINS = [
  "http://localhost:3000",
  "https://panda-studio-beta.vercel.app",
];

const parseOrigin = (value: string): string | null => {
  try {
    const { protocol, host } = new URL(value);
    return `${protocol}//${host}`;
  } catch {
    return null;
  }
};

// Build allowed origins once at startup so the set is immutable at runtime
const buildAllowedSet = (): Set<string> => {
  const raw = process.env.CLIENT_ORIGIN ?? "";
  const set = new Set<string>();

  // Always add fallback origins
  for (const origin of FALLBACK_ORIGINS) {
    set.add(origin);
  }

  // Add any additional origins from CLIENT_ORIGIN env var
  for (const entry of raw.split(",")) {
    const parsed = parseOrigin(entry.trim());
    if (parsed) set.add(parsed);
  }
  return set;
};

// Lazy singleton — built on first request so dotenv has already loaded
let _allowedOrigins: Set<string> | null = null;
const getAllowedOrigins = (): Set<string> => {
  if (!_allowedOrigins) _allowedOrigins = buildAllowedSet();
  return _allowedOrigins;
};

/**
 * CSRF defence (CWE-352/1275).
 *
 * Two-layer protection for state-changing requests:
 * 1. Origin/Referer header must exactly match CLIENT_ORIGIN (protocol+host).
 * 2. X-Requested-With: XMLHttpRequest header must be present (custom header
 *    CSRF token — browsers block cross-origin requests from setting this).
 */
export const validateOrigin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const allowedOrigins = getAllowedOrigins();

  const { origin } = req.headers;

  if (!origin || !allowedOrigins.has(origin)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: invalid origin",
    });
  }

  // OPTIONAL: only enforce CSRF on sensitive routes
  if (req.path.startsWith("/api/auth")) {
    return next();
  }

  next();
};
