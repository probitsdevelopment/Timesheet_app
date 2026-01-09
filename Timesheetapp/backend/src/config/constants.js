// Security constants
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChar: true
};

const DEFAULT_ORGANIZATION = 'Default Organization';
const DEFAULT_USER_ROLE = 'admin';

// Rate limiting
const RATE_LIMITS = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10
  }
};

// JWT
const JWT_EXPIRATION = '7d';

module.exports = {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  DEFAULT_ORGANIZATION,
  DEFAULT_USER_ROLE,
  RATE_LIMITS,
  JWT_EXPIRATION
};
