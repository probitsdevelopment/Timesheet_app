const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { RATE_LIMITS } = require('../config/constants');

// Allow all origins in production (Railway will have different domains)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",") 
  : process.env.NODE_ENV === 'production'
  ? "*" // Allow all origins in production
  : ["http://localhost:8080", "http://localhost:3000", "http://127.0.0.1:8080", "http://127.0.0.1:3000"];

// CORS Configuration
const corsConfig = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
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
