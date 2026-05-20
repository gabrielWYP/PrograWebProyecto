const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication-related endpoints.
 * Allows 5 requests per 15-minute window per IP.
 * Applied to: POST /auth/login, PUT /users/recoverpassword
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
});

module.exports = { authLimiter };
