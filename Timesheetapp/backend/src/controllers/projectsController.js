const db = require('../../db');
const { logSecurityEvent } = require('../utils/logger');
const { DEFAULT_ORGANIZATION } = require('../config/constants');

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const organization = req.user.organization || DEFAULT_ORGANIZATION;
    const isAdmin = req.user.role === 'admin';
    
    let query;
    let params;
    
    if (isAdmin) {
      // Admins can see all projects in the organization
      query = "SELECT id, name, code, description, status, created_by, created_at, COALESCE(CAST(start_date AS TEXT), CAST(DATE(created_at) AS TEXT)) as \"startDate\", organization FROM projects WHERE organization = $1 ORDER BY created_at DESC";
      params = [organization];
    } else {
      // Regular users can only see projects they created
      query = "SELECT id, name, code, description, status, created_by, created_at, COALESCE(CAST(start_date AS TEXT), CAST(DATE(created_at) AS TEXT)) as \"startDate\", organization FROM projects WHERE organization = $1 AND created_by = $2 ORDER BY created_at DESC";
      params = [organization, req.user.userId];
    }
    
    const projects = await db.getAll(query, params);

    logSecurityEvent("PROJECTS_READ", { userId: req.user.userId, count: projects.length, isAdmin });

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
    const isAdmin = req.user.role === 'admin';
    
    const project = await db.getOne(
      "SELECT id, name, code, description, status, created_by, created_at, CAST(COALESCE(start_date, DATE(created_at)) AS TEXT) as startDate, organization FROM projects WHERE id = $1 AND organization = $2",
      [req.params.id, organization]
    );

    if (!project) {
      logSecurityEvent("PROJECT_NOT_FOUND", { projectId: req.params.id });
      return res.status(404).json({ error: "Project not found" });
    }

    // Check access: user must be the creator or an admin
    if (!isAdmin && project.created_by !== req.user.userId) {
      logSecurityEvent("PROJECT_ACCESS_DENIED", { projectId: req.params.id, userId: req.user.userId });
      return res.status(403).json({ error: "You don't have permission to access this project" });
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
      "INSERT INTO projects (name, code, description, status, created_by, start_date, organization) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, code, description, status, created_by, created_at, CAST(COALESCE(start_date, DATE(created_at)) AS TEXT) as startDate, organization",
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
    const isAdmin = req.user.role === 'admin';
    const organization = req.user.organization || DEFAULT_ORGANIZATION;

    // First, get the project to check ownership
    const projectCheck = await db.getOne(
      "SELECT created_by FROM projects WHERE id = $1 AND organization = $2",
      [req.params.id, organization]
    );

    if (!projectCheck) {
      logSecurityEvent("PROJECT_NOT_FOUND", { projectId: req.params.id });
      return res.status(404).json({ error: "Project not found" });
    }

    // Check permissions: user must be creator or admin
    if (!isAdmin && projectCheck.created_by !== req.user.userId) {
      logSecurityEvent("PROJECT_UPDATE_DENIED", { projectId: req.params.id, userId: req.user.userId });
      return res.status(403).json({ error: "You don't have permission to update this project" });
    }

    const result = await db.query(
      "UPDATE projects SET name = $1, code = $2, description = $3, status = $4, start_date = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND organization = $7 RETURNING id, name, code, description, status, created_by, created_at, CAST(COALESCE(start_date, DATE(created_at)) AS TEXT) as startDate, organization",
      [name, code, description, status, startDate, req.params.id, organization]
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
    const organization = req.user.organization || DEFAULT_ORGANIZATION;
    const isAdmin = req.user.role === 'admin';

    // First, get the project to check ownership
    const projectCheck = await db.getOne(
      "SELECT created_by FROM projects WHERE id = $1 AND organization = $2",
      [req.params.id, organization]
    );

    if (!projectCheck) {
      logSecurityEvent("PROJECT_NOT_FOUND", { projectId: req.params.id });
      return res.status(404).json({ error: "Project not found" });
    }

    // Check permissions: user must be creator or admin
    if (!isAdmin && projectCheck.created_by !== req.user.userId) {
      logSecurityEvent("PROJECT_DELETE_DENIED", { projectId: req.params.id, userId: req.user.userId });
      return res.status(403).json({ error: "You don't have permission to delete this project" });
    }

    const result = await db.query(
      "DELETE FROM projects WHERE id = $1 AND organization = $2 RETURNING id",
      [req.params.id, organization]
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
