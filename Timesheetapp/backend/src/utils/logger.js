// Security logging utility
const logSecurityEvent = (event, details) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${event}:`, details);
};

module.exports = {
  logSecurityEvent
};
