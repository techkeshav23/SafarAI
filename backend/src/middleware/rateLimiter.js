/**
 * Simple in-memory rate limiter.
 * For production, use express-rate-limit with a Redis store.
 */

const windowMs = 60 * 1000; // 1 minute
const maxRequests = 30; // max requests per window per IP
const store = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.start > windowMs * 2) store.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.start > windowMs) {
    store.set(ip, { start: now, count: 1 });
    return next();
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    return res.status(429).json({
      error: {
        message: "Too many requests. Please try again later.",
      },
    });
  }

  next();
}
