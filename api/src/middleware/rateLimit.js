import rateLimit from 'express-rate-limit';

// Limit to 60 requests/minute per IP
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please try again later.' },
});
