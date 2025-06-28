import rateLimit from 'express-rate-limit';

// Limit login attempts: max 5 tries per 10 minutes per IP
export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: 'Too many login attempts from this IP, please try again after 10 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit refresh token abuse: 30 attempts/hour per IP
export const refreshRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: 'Too many token refresh attempts, slow down!',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 min per IP
    message: 'Too many requests, try again later.',
  });
  