import rateLimit from "express-rate-limit";

// Global limiter (for all routes)
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requests per IP
  message: { error: "Too many requests, try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes limiter
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per IP
  message: { error: "Too many requests on public API, try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Sensitive route limiter - stricter
export const sensitiveLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // max 5 requests per IP
  message: { error: "Too many requests, try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Contact message route limiter - stricter
export const contactMessageLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute
  max: 2, // max 2 requests per IP
  message: { error: "Too many requests, try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
