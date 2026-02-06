const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { RATE_LIMITS } = require('../config/constants');

// CORS Configuration - Allow frontend origins and handle credentials
const allowedOrigins = [
  // Local development
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000',
  // Production Railway
  'https://robust-flow-production.up.railway.app',  // Frontend production
];

const corsConfig = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl requests, mobile apps, or service workers)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in whitelist
    const isAllowed = allowedOrigins.includes(origin);
    
    // In development, allow all origins for testing
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, only allow whitelisted origins
    if (process.env.NODE_ENV === 'production') {
      if (isAllowed) {
        return callback(null, true);
      } else {
        console.warn(`⚠️  CORS rejected origin: ${origin}`);
        return callback(new Error('CORS not allowed'), false);
      }
    }
    
    // Default: allow
    return callback(null, isAllowed);
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Allow cookies/credentials
  optionsSuccessStatus: 200,
  maxAge: 3600  // Cache preflight requests for 1 hour
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
