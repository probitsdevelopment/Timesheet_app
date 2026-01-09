 const db = require('../../db');
const { logSecurityEvent } = require('../utils/logger');

// GET all timesheets (for managers to see submitted timesheets)
const getAllTimesheets = async (req, res) => {
  try {
    const { submittedTo, status } = req.query;
    let query = `
      SELECT 
        ts.id, 
        ts.user_id, 
        u.name as user_name,
        ts.month, 
        ts.year, 
        ts.total_hours, 
        ts.status, 
        ts.submitted_to, 
        ts.submitted_at, 
        ts.approved_by, 
        ts.rejection_reason, 
        ts.organization, 
        ts.created_at, 
        ts.updated_at,
        (SELECT COUNT(*) FROM time_entries WHERE user_id = ts.user_id AND TO_CHAR(date, 'YYYY-MM') = ts.month) as entries_count
      FROM timesheets ts 
      JOIN users u ON ts.user_id = u.id 
      WHERE ts.organization = $1`;
    const params = [req.user.organization || 'Default Organization'];

    console.log('📋 Fetching timesheets:', { submittedTo, status, userId: req.user.userId });

    if (submittedTo) {
      query += " AND ts.submitted_to = $2";
      params.push(parseInt(submittedTo));
    }

    if (status) {
      query += ` AND ts.status = $${params.length + 1}`;
      params.push(status);
    }

    query += " ORDER BY ts.submitted_at DESC";

    const timesheets = await db.getAll(query, params);
    console.log('✅ Found timesheets:', timesheets.length, timesheets);
    res.json(timesheets || []);
  } catch (error) {
    console.error("❌ Get timesheets error:", error);
    res.status(500).json({ error: "Failed to retrieve timesheets" });
  }
};

// GET timesheet by ID
const getTimesheetById = async (req, res) => {
  try {
    const timesheet = await db.getOne(
      "SELECT * FROM timesheets WHERE id = $1 AND organization = $2",
      [req.params.id, req.user.organization || 'Default Organization']
    );

    if (!timesheet) {
      return res.status(404).json({ error: "Timesheet not found" });
    }

    res.json(timesheet);
  } catch (error) {
    console.error("❌ Get timesheet error:", error);
    res.status(500).json({ error: "Failed to retrieve timesheet" });
  }
};

// CREATE timesheet
const createTimesheet = async (req, res) => {
  try {
    const { month, year, total_hours, totalHours, status, submitted_to, submittedTo } = req.body;
    
    console.log('📋 Creating timesheet:', { month, year, total_hours, totalHours, status, submitted_to, submittedTo });

    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }

    const hours = total_hours || totalHours || 0;
    const managerId = submitted_to || submittedTo || null;

    const result = await db.query(
      "INSERT INTO timesheets (user_id, month, year, total_hours, status, submitted_to, submitted_at, organization) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7) RETURNING *",
      [req.user.userId, month, year || new Date().getFullYear(), hours, status || 'draft', managerId, req.user.organization || 'Default Organization']
    );

    console.log('✅ Timesheet created:', result.rows[0]);
    logSecurityEvent("TIMESHEET_CREATED", { timesheetId: result.rows[0].id, userId: req.user.userId, submittedTo: managerId });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Create timesheet error:", error);
    res.status(500).json({ error: "Failed to create timesheet" });
  }
};

// UPDATE timesheet (approve/reject)
const updateTimesheet = async (req, res) => {
  try {
    const { status, approvedBy, rejectionReason } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const result = await db.query(
      "UPDATE timesheets SET status = $1, approved_by = $2, rejection_reason = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND organization = $5 RETURNING *",
      [status, approvedBy || null, rejectionReason || null, req.params.id, req.user.organization || 'Default Organization']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Timesheet not found or unauthorized" });
    }

    logSecurityEvent("TIMESHEET_UPDATED", { timesheetId: req.params.id, status, updatedBy: req.user.userId });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Update timesheet error:", error);
    res.status(500).json({ error: "Failed to update timesheet" });
  }
};

// DELETE timesheet
const deleteTimesheet = async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM timesheets WHERE id = $1 AND user_id = $2 AND organization = $3 RETURNING id",
      [req.params.id, req.user.userId, req.user.organization || 'Default Organization']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Timesheet not found or unauthorized" });
    }

    logSecurityEvent("TIMESHEET_DELETED", { timesheetId: req.params.id, userId: req.user.userId });

    res.json({ message: "Timesheet deleted successfully" });
  } catch (error) {
    console.error("❌ Delete timesheet error:", error);
    res.status(500).json({ error: "Failed to delete timesheet" });
  }
};

module.exports = {
  getAllTimesheets,
  getTimesheetById,
  createTimesheet,
  updateTimesheet,
  deleteTimesheet
};
