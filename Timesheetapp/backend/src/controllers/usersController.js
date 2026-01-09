const bcrypt = require('bcrypt');
const db = require('../../db');
const { logSecurityEvent } = require('../utils/logger');
const { DEFAULT_ORGANIZATION } = require('../config/constants');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const organization = req.user.organization || DEFAULT_ORGANIZATION;
    const users = await db.getAll(
      "SELECT id, COALESCE(name, username) as name, email, role, manager_id as managerId, created_at, organization, number_of_hours as numberOfHours FROM users WHERE organization = $1 ORDER BY created_at DESC",
      [organization]
    );

    logSecurityEvent("USERS_READ", { userId: req.user.userId, count: users.length });

    res.json(users);
  } catch (error) {
    console.error("❌ Get users error:", error);
    res.status(500).json({ error: "Failed to retrieve users" });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const organization = req.user.organization || DEFAULT_ORGANIZATION;
    const user = await db.getOne(
      "SELECT id, COALESCE(name, username) as name, email, role, manager_id as managerId, created_at, organization, number_of_hours as numberOfHours FROM users WHERE id = $1 AND organization = $2",
      [req.params.id, organization]
    );

    if (!user) {
      logSecurityEvent("USER_NOT_FOUND", { userId: req.params.id });
      return res.status(404).json({ error: "User not found" });
    }

    logSecurityEvent("USER_READ", { userId: req.params.id, requestedBy: req.user.userId });

    res.json(user);
  } catch (error) {
    console.error("❌ Get user error:", error);
    res.status(500).json({ error: "Failed to retrieve user" });
  }
};

// Create user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, organization = req.user.organization, numberOfHours } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters with uppercase, lowercase, number, and special character" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.query(
      "INSERT INTO users (username, email, password, name, role, is_active, organization, number_of_hours) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, COALESCE(name, username) as name, email, role, created_at, organization, number_of_hours",
      [email, email, hashedPassword, name, role || "employee", true, organization, numberOfHours || 0]
    );

    const user = result.rows[0];

    logSecurityEvent("USER_CREATED", { userId: user.id, createdBy: req.user.userId });

    res.status(201).json(user);
  } catch (error) {
    console.error("❌ Create user error:", error);
    if (error.code === '23505') {
      res.status(400).json({ error: "Username or email already exists" });
    } else {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, role, is_active, organization, numberOfHours } = req.body;

    const result = await db.query(
      "UPDATE users SET name = $1, email = $2, role = $3, is_active = $4, organization = $5, number_of_hours = $6 WHERE id = $7 RETURNING id, COALESCE(name, username) as name, email, role, created_at, is_active, organization, number_of_hours as numberOfHours",
      [name, email, role, is_active, organization, numberOfHours || 0, req.params.id]
    );

    if (result.rows.length === 0) {
      logSecurityEvent("USER_NOT_FOUND", { userId: req.params.id });
      return res.status(404).json({ error: "User not found" });
    }

    logSecurityEvent("USER_UPDATED", { userId: req.params.id, updatedBy: req.user.userId });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Update user error:", error);
    if (error.code === '23505') {
      res.status(400).json({ error: "Username or email already exists" });
    } else {
      res.status(500).json({ error: "Failed to update user" });
    }
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    // Prevent deleting self
    if (parseInt(req.params.id) === req.user.userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const result = await db.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      logSecurityEvent("USER_NOT_FOUND", { userId: req.params.id });
      return res.status(404).json({ error: "User not found" });
    }

    logSecurityEvent("USER_DELETED", { userId: req.params.id, deletedBy: req.user.userId });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("❌ Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Assign manager to user
const assignManager = async (req, res) => {
  try {
    const { manager_id } = req.body;

    if (!manager_id) {
      return res.status(400).json({ error: "Manager ID is required" });
    }

    const result = await db.query(
      "UPDATE users SET manager_id = $1 WHERE id = $2 RETURNING id, username, email, role, manager_id as managerId, created_at",
      [manager_id, req.params.id]
    );

    if (result.rows.length === 0) {
      logSecurityEvent("USER_NOT_FOUND", { userId: req.params.id });
      return res.status(404).json({ error: "User not found" });
    }

    logSecurityEvent("MANAGER_ASSIGNED", { userId: req.params.id, managerId: manager_id, assignedBy: req.user.userId });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Assign manager error:", error);
    res.status(500).json({ error: "Failed to assign manager" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignManager
};
