const validator = require('validator');
const { PASSWORD_REQUIREMENTS } = require('../config/constants');

const validatePassword = (password) => {
  const { minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChar } = PASSWORD_REQUIREMENTS;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (password.length < minLength) {
    return { valid: false, error: `Password must be at least ${minLength} characters` };
  }
  if (requireUppercase && !hasUpperCase) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }
  if (requireLowercase && !hasLowerCase) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }
  if (requireNumbers && !hasNumbers) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  if (requireSpecialChar && !hasSpecialChar) {
    return { valid: false, error: "Password must contain at least one special character" };
  }
  return { valid: true };
};

const validateEmail = (email) => validator.isEmail(email);

const validateUsername = (username) => /^[a-zA-Z0-9_]{3,20}$/.test(username);

const validateUserInput = (name, email, password) => {
  if (!name || !email || !password) {
    return { valid: false, error: "All fields are required" };
  }

  if (!validateEmail(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { valid: false, error: passwordValidation.error };
  }

  return { valid: true };
};

module.exports = {
  validatePassword,
  validateEmail,
  validateUsername,
  validateUserInput
};
