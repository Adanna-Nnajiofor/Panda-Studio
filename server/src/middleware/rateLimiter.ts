interface RateEntry {
  count: number;
  firstRequest: number;
}

type KeyResolver = (req: any) => string;

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  keyResolver?: KeyResolver;
}

const defaultKeyResolver: KeyResolver = (req: any) => {
  const ip =
    req.ip || req.headers?.["x-forwarded-for"]?.toString() || "unknown";
  return String(ip);
};

export const createRateLimiter = ({
  windowMs,
  maxRequests,
  keyResolver = defaultKeyResolver,
}: RateLimiterOptions) => {
  const rateMap = new Map<string, RateEntry>();

  return (req: any, res: any, next: any) => {
    const key = keyResolver(req);
    const now = Date.now();
    const entry = rateMap.get(key);

    if (!entry || now - entry.firstRequest > windowMs) {
      rateMap.set(key, { count: 1, firstRequest: now });
      return next();
    }

    entry.count += 1;
    rateMap.set(key, entry);

    if (entry.count > maxRequests) {
      return res.status(429).json({
        message: "Too many requests. Please try again later.",
      });
    }

    next();
  };
};

export const rateLimiter = () => {
  return createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 150,
  });
};

export const authLoginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  keyResolver: (req) => {
    const ip =
      req.ip || req.headers?.["x-forwarded-for"]?.toString() || "unknown";
    const email = (req.body?.email ?? "").toString().trim().toLowerCase();
    return `${String(ip)}:${email || "no-email"}`;
  },
});

export const authSensitiveRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
});

export const paymentRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 40,
});
