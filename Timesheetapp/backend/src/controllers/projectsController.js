const db = require('../../db');
const { logSecurityEvent } = require('../utils/logger');
const { DEFAULT_ORGANIZATION } = require('../config/constants');

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const organization = req.user.organization || DEFAULT_ORGANIZATION;
    const projects = await db.getAll(
      "SELECT id, name, code, description, status, created_by, created_at, start_date as startDate, organization FROM projects WHERE organization = $1 ORDER BY created_at DESC",
      [organization]
    );

    logSecurityEvent("PROJECTS_READ", { userId: req.user.userId, count: projects.length });

    res.json(projects);
  } catch (error) {
    console.error("❌ Get projects error:", error);
    res.status(500).json({ error: "Failed to retrieve projects" });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const organization = req.user.organization || DEFAULT_ORGANIZATION;
    const project = await db.getOne(
      "SELECT id, name, code, description, status, created_by, created_at, start_date as startDate, organization FROM projects WHERE id = $1 AND organization = $2",
      [req.params.id, organization]
    );

    if (!project) {
      logSecurityEvent("PROJECT_NOT_FOUND", { projectId: req.params.id });
      return res.status(404).json({ error: "Project not found" });
    }

    logSecurityEvent("PROJECT_READ", { projectId: req.params.id, userId: req.user.userId });

    res.json(project);
  } catch (error) {
    console.error("❌ Get project error:", error);
    res.status(500).json({ error: "Failed to retrieve project" });
  }
};

// Create project
const createProject = async (req, res) => {
  try {
    const { name, code, description, status, startDate } = req.body;
    const organization = req.user.organization || DEFAULT_ORGANIZATION;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    // Generate unique code if not provided
    let projectCode = code;
    if (!projectCode) {
      // Generate code from first 3 letters of name + timestamp
      const prefix = name.substring(0, 3).toUpperCase();
      projectCode = `${prefix}-${Date.now().toString().slice(-4)}`;
    }

    const result = await db.query(
      "INSERT INTO projects (name, code, description, status, created_by, start_date, organization) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, code, description, status, created_by, created_at, start_date as startDate, organization",
      [name, projectCode, description || "", status || "active", req.user.userId, startDate || new Date().toISOString().split('T')[0], organization]
    );

    const project = result.rows[0];

    logSecurityEvent("PROJECT_CREATED", { projectId: project.id, userId: req.user.userId });

    res.status(201).json(project);
  } catch (error) {
    console.error("❌ Create project error:", error);
    // Check if it's a duplicate code error
    if (error.code === '23505') {
      return res.status(400).json({ error: "Project code already exists in this organization" });
    }
    res.status(500).json({ error: "Failed to create project" });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { name, code, description, status, startDate } = req.body;

    const result = await db.query(
      "UPDATE projects SET name = $1, code = $2, description = $3, status = $4, start_date = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND organization = $7 RETURNING id, name, code, description, status, created_by, created_at, start_date as startDate, organization",
      [name, code, description, status, startDate, req.params.id, req.user.organization]
    );

    if (result.rows.length === 0) {
      logSecurityEvent("PROJECT_NOT_FOUND", { projectId: req.params.id });
      return res.status(404).json({ error: "Project not found" });
    }

    logSecurityEvent("PROJECT_UPDATED", { projectId: req.params.id, userId: req.user.userId });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Update project error:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM projects WHERE id = $1 AND organization = $2 RETURNING id",
      [req.params.id, req.user.organization]
    );

    if (result.rows.length === 0) {
      logSecurityEvent("PROJECT_NOT_FOUND", { projectId: req.params.id });
      return res.status(404).json({ error: "Project not found" });
    }

    logSecurityEvent("PROJECT_DELETED", { projectId: req.params.id, userId: req.user.userId });

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("❌ Delete project error:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
