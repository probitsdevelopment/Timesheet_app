const db = require('../../db');
const { logSecurityEvent } = require('../utils/logger');
const { DEFAULT_ORGANIZATION } = require('../config/constants');

// Get all time entries (user's own entries only)
const getAllTimeEntries = async (req, res) => {
  try {
    const organization = req.user.organization || DEFAULT_ORGANIZATION;
    const { workLocation } = req.query;  // ✅ NEW: Accept location filter
    
    console.log(`🔍 DEBUG: Fetching entries for user_id=${req.user.userId}, organization=${organization}, workLocation=${workLocation}`);
    
    let query = "SELECT id, user_id, project_id, TO_CHAR(date, 'YYYY-MM-DD') as date, task_start, task_end, CAST(hours AS DECIMAL) as hours, description, reason, status, work_location, created_at, organization FROM time_entries WHERE user_id = $1 AND organization = $2";
    let params = [req.user.userId, organization];

    // ✅ NEW: Add location filter if provided
    if (workLocation && ['office', 'work_from_home'].includes(workLocation)) {
      query += " AND work_location = $3";
      params.push(workLocation);
    }

    query += " ORDER BY date DESC";
    
    const entries = await db.getAll(query, params);

    // Ensure hours is a number
    const formattedEntries = entries.map(entry => ({
      ...entry,
      hours: parseFloat(entry.hours) || 0,
    }));

    console.log(`✅ Found ${formattedEntries.length} entries for user_id=${req.user.userId}`);
    logSecurityEvent("TIME_ENTRIES_READ", { userId: req.user.userId, count: formattedEntries.length });

    res.json(formattedEntries);
  } catch (error) {
    console.error("❌ Get time entries error:", error);
    res.status(500).json({ error: "Failed to retrieve time entries" });
  }
};

// Get user's time entries
const getUserTimeEntries = async (req, res) => {
  try {
    const organization = req.user.organization || DEFAULT_ORGANIZATION;
    const entries = await db.getAll(
      "SELECT id, user_id, project_id, TO_CHAR(date, 'YYYY-MM-DD') as date, task_start, task_end, CAST(hours AS DECIMAL) as hours, description, reason, status, work_location, created_at, organization FROM time_entries WHERE user_id = $1 AND organization = $2 ORDER BY date DESC",
      [req.user.userId, organization]
    );

    // Ensure hours is a number
    const formattedEntries = entries.map(entry => ({
      ...entry,
      hours: parseFloat(entry.hours) || 0,
    }));

    logSecurityEvent("USER_TIME_ENTRIES_READ", { userId: req.user.userId, count: formattedEntries.length });

    res.json(formattedEntries);
  } catch (error) {
    console.error("❌ Get user time entries error:", error);
    res.status(500).json({ error: "Failed to retrieve time entries" });
  }
};

// Create time entry
const createTimeEntry = async (req, res) => {
  try {
    const { project_id, date, hours, description, reason, status, task_start, task_end, work_location } = req.body;

    if (!project_id || !date || !hours) {
      return res.status(400).json({ error: "Project, date, and hours are required" });
    }

    // ✅ NEW: Validate work_location
    const validLocation = work_location || 'office';
    if (!['office', 'work_from_home'].includes(validLocation)) {
      return res.status(400).json({ error: "Invalid work location. Must be 'office' or 'work_from_home'" });
    }

    console.log(`📝 Creating entry - Date received: ${date}, Type: ${typeof date}, Location: ${validLocation}`);

    const result = await db.query(
      "INSERT INTO time_entries (user_id, project_id, date, task_start, task_end, hours, description, reason, status, work_location, organization) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
      [req.user.userId, project_id, date, task_start || null, task_end || null, hours, description || "", reason || "Development", status || "pending", validLocation, req.user.organization]
    );

    const entry = result.rows[0];
    console.log(`✅ Entry created - Date in DB: ${entry.date}, Location: ${entry.work_location}`);

    logSecurityEvent("TIME_ENTRY_CREATED", { entryId: entry.id, userId: req.user.userId, workLocation: validLocation });

    res.status(201).json(entry);
  } catch (error) {
    console.error("❌ Create time entry error:", error);
    res.status(500).json({ error: "Failed to create time entry" });
  }
};

// Update time entry
const updateTimeEntry = async (req, res) => {
  try {
    const { project_id, date, hours, description, reason, status, task_start, task_end, work_location } = req.body;

    // ✅ NEW: Validate work_location if provided
    if (work_location && !['office', 'work_from_home'].includes(work_location)) {
      return res.status(400).json({ error: "Invalid work location. Must be 'office' or 'work_from_home'" });
    }

    const result = await db.query(
      "UPDATE time_entries SET project_id = $1, date = $2, task_start = $3, task_end = $4, hours = $5, description = $6, reason = $7, status = $8, work_location = $9, updated_at = CURRENT_TIMESTAMP WHERE id = $10 AND user_id = $11 AND organization = $12 RETURNING *",
      [project_id, date, task_start || null, task_end || null, hours, description, reason, status, work_location || 'office', req.params.id, req.user.userId, req.user.organization]
    );

    if (result.rows.length === 0) {
      logSecurityEvent("TIME_ENTRY_NOT_FOUND", { entryId: req.params.id, userId: req.user.userId });
      return res.status(404).json({ error: "Time entry not found or unauthorized" });
    }

    logSecurityEvent("TIME_ENTRY_UPDATED", { entryId: req.params.id, userId: req.user.userId, workLocation: work_location || 'office' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Update time entry error:", error);
    res.status(500).json({ error: "Failed to update time entry" });
  }
};

// Get entries by specific user ID (for managers viewing employee timesheets)
const getEntriesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const organization = req.user.organization || DEFAULT_ORGANIZATION;
    
    const entries = await db.getAll(
      "SELECT id, user_id, project_id, TO_CHAR(date, 'YYYY-MM-DD') as date, task_start, task_end, CAST(hours AS DECIMAL) as hours, description, reason, status, created_at, organization FROM time_entries WHERE user_id = $1 AND organization = $2 ORDER BY date DESC",
      [userId, organization]
    );

    // Ensure hours is a number
    const formattedEntries = entries.map(entry => ({
      ...entry,
      hours: parseFloat(entry.hours) || 0,
    }));

    console.log(`✅ Found ${formattedEntries.length} entries for user_id=${userId}`);
    logSecurityEvent("USER_ENTRIES_READ", { requestedBy: req.user.userId, targetUser: userId, count: formattedEntries.length });

    res.json(formattedEntries);
  } catch (error) {
    console.error("❌ Get user entries error:", error);
    res.status(500).json({ error: "Failed to retrieve user entries" });
  }
};

// Delete time entry
const deleteTimeEntry = async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM time_entries WHERE id = $1 AND user_id = $2 AND organization = $3 RETURNING id",
      [req.params.id, req.user.userId, req.user.organization]
    );

    if (result.rows.length === 0) {
      logSecurityEvent("TIME_ENTRY_NOT_FOUND", { entryId: req.params.id, userId: req.user.userId });
      return res.status(404).json({ error: "Time entry not found or unauthorized" });
    }

    logSecurityEvent("TIME_ENTRY_DELETED", { entryId: req.params.id, userId: req.user.userId });

    res.json({ message: "Time entry deleted successfully" });
  } catch (error) {
    console.error("❌ Delete time entry error:", error);
    res.status(500).json({ error: "Failed to delete time entry" });
  }
};

module.exports = {
  getAllTimeEntries,
  getUserTimeEntries,
  getEntriesByUserId,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry
};
