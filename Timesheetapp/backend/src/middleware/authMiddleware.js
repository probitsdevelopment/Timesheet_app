const jwt = require('jsonwebtoken');
const { logSecurityEvent } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET is not set in .env file");
  process.exit(1);
}

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    logSecurityEvent("TOKEN_VERIFICATION_FAILED", { reason: "No token provided" });
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logSecurityEvent("TOKEN_VERIFICATION_FAILED", { reason: error.message });
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = {
  verifyToken,
  JWT_SECRET
};
