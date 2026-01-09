const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../db');
const { validateUserInput } = require('../utils/validators');
const { logSecurityEvent } = require('../utils/logger');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { DEFAULT_ORGANIZATION, DEFAULT_USER_ROLE, JWT_EXPIRATION } = require('../config/constants');

// Register User
const register = async (req, res) => {
  try {
    const { name, email, password, organization = DEFAULT_ORGANIZATION } = req.body;

    const validation = validateUserInput(name, email, password);
    if (!validation.valid) {
      logSecurityEvent("REGISTRATION_FAILED", { reason: validation.error });
      return res.status(400).json({ error: validation.error });
    }

    // Check if user already exists
    const userExists = await db.getOne(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userExists) {
      logSecurityEvent("REGISTRATION_FAILED", { email, reason: "User already exists" });
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user
    const result = await db.query(
      "INSERT INTO users (username, email, password, name, role, organization) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, name, role, organization",
      [email, email, hashedPassword, name, DEFAULT_USER_ROLE, organization]
    );

    const newUser = result.rows[0];

    logSecurityEvent("USER_REGISTERED", { userId: newUser.id, email, name });

    res.status(201).json({
      message: "User registered successfully",
      user: newUser
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    logSecurityEvent("REGISTRATION_ERROR", { error: error.message });
    res.status(500).json({ error: "Registration failed" });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      logSecurityEvent("LOGIN_FAILED", { reason: "Missing credentials" });
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user by email
    const user = await db.getOne(
      "SELECT u.id, u.username, u.email, u.password, u.name, u.role, u.organization, u.manager_id as managerid, m.name as manager_name FROM users u LEFT JOIN users m ON u.manager_id = m.id WHERE u.email = $1",
      [email]
    );

    if (!user) {
      logSecurityEvent("LOGIN_FAILED", { email, reason: "User not found" });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      logSecurityEvent("LOGIN_FAILED", { userId: user.id, reason: "Invalid password" });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username, name: user.name, role: user.role, organization: user.organization, managerid: user.managerid, manager_name: user.manager_name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Update last login
    await db.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    logSecurityEvent("USER_LOGGED_IN", { userId: user.id, email: user.email });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
        managerid: user.managerid,
        manager_name: user.manager_name
      }
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    logSecurityEvent("LOGIN_ERROR", { error: error.message });
    res.status(500).json({ error: "Login failed" });
  }
};

// Get Current User
const getCurrentUser = async (req, res) => {
  try {
    const user = await db.getOne(
      "SELECT id, username, email, role, created_at, last_login FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (!user) {
      logSecurityEvent("USER_NOT_FOUND", { userId: req.user.userId });
      return res.status(404).json({ error: "User not found" });
    }

    logSecurityEvent("USER_DATA_RETRIEVED", { userId: user.id });

    res.json(user);
  } catch (error) {
    console.error("❌ Get user error:", error);
    res.status(500).json({ error: "Failed to retrieve user" });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
};
