const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { RATE_LIMITS } = require('../config/constants');

// CORS Configuration - Allow all origins in production
const corsConfig = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
};

// Security Headers Middleware
const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
};

// Rate Limiters
const noOpLimiter = (req, res, next) => next(); // No rate limiting

const loginLimiter = process.env.DISABLE_RATE_LIMIT === 'true' ? noOpLimiter : rateLimit({
  windowMs: RATE_LIMITS.login.windowMs,
  max: RATE_LIMITS.login.max,
  message: "Too many login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = process.env.DISABLE_RATE_LIMIT === 'true' ? noOpLimiter : rateLimit({
  windowMs: RATE_LIMITS.register.windowMs,
  max: RATE_LIMITS.register.max,
  message: "Too many registration attempts, please try again later"
});

module.exports = {
  corsConfig,
  securityHeaders,
  loginLimiter,
  registerLimiter
};
