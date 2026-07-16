const attempts = new Map();

const cleanupExpiredEntries = (now) => {
  if (attempts.size < 500) return;
  for (const [key, value] of attempts) {
    if (value.resetAt <= now) attempts.delete(key);
  }
};

export const esewaRateLimit = ({ max = 20, windowMs = 10 * 60 * 1000, onlyEsewaOrders = false } = {}) =>
  (req, res, next) => {
    if (onlyEsewaOrders && req.body?.paymentMethod !== "esewa") return next();

    const now = Date.now();
    cleanupExpiredEntries(now);
    const identity = req.user?.id || req.ip || "anonymous";
    const key = `${identity}:${req.baseUrl}:${req.route?.path || req.path}`;
    const current = attempts.get(key);
    const entry = !current || current.resetAt <= now
      ? { count: 1, resetAt: now + windowMs }
      : { ...current, count: current.count + 1 };
    attempts.set(key, entry);

    if (entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ status: 429, message: "Too many eSewa payment requests. Please try again shortly." });
    }
    return next();
  };
