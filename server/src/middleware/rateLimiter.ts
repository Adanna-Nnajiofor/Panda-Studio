interface RateEntry {
  count: number;
  firstRequest: number;
}

const rateMap = new Map<string, RateEntry>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 150;

export const rateLimiter = () => {
  return (req: any, res: any, next: any) => {
    const ip =
      req.ip || req.headers?.["x-forwarded-for"]?.toString() || "unknown";
    const now = Date.now();
    const entry = rateMap.get(ip);

    if (!entry || now - entry.firstRequest > WINDOW_MS) {
      rateMap.set(ip, { count: 1, firstRequest: now });
      return next();
    }

    entry.count += 1;
    rateMap.set(ip, entry);

    if (entry.count > MAX_REQUESTS) {
      return res.status(429).json({
        message: "Too many requests. Please try again later.",
      });
    }

    next();
  };
};
