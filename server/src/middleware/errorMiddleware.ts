import logger from '../utils/logger';

type ErrorWithStatus = {
  statusCode?: number;
  status?: number;
  message?: string;
};

const sanitizeLog = (value: unknown): string => {
  const raw =
    value instanceof Error
      ? `${value.name}: ${value.message}`
      : String(value ?? "Unknown error");
  return raw
    .replace(/[\r\n\t\0]/g, " ")
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
    .slice(0, 500);
};

const sanitizeMessage = (message: unknown): string => {
  if (typeof message !== "string") return "Internal server error";
  return message
    .replace(/[\r\n\t\0]/g, " ")
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
    .slice(0, 200);
};

export const errorMiddleware = (
  err: unknown,
  _req: any,
  res: any,
  _next: any,
) => {
  const error = err as ErrorWithStatus;

  logger.error('[errorMiddleware]', { error: sanitizeLog(err) });

  const statusCode = error?.statusCode ?? error?.status ?? 500;
  const message = sanitizeMessage(error?.message ?? "Internal server error");

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { error: sanitizeLog(err) }),
  });
};
