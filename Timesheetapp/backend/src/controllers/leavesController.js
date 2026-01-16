const db = require('../../db');
const { logSecurityEvent } = require('../utils/logger');
const { DEFAULT_ORGANIZATION } = require('../config/constants');

// Get all leaves for current user
const getAllLeaves = async (req, res) => {
  try {
    const organization = req.user.organization || DEFAULT_ORGANIZATION;
    
    const leaves = await db.getAll(
      "SELECT id, user_id, leave_type, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, reason, status, submitted_to, rejection_reason, is_paid_leave, created_at, organization FROM leaves WHERE user_id = $1 AND organization = $2 ORDER BY start_date DESC",
      [req.user.userId, organization]
    );

    console.log(`✅ Found ${leaves.length} leaves for user_id=${req.user.userId}`);
    logSecurityEvent("LEAVES_READ", { userId: req.user.userId, count: leaves.length });

    res.json(leaves);
  } catch (error) {
    console.error("❌ Get leaves error:", error);
    res.status(500).json({ error: "Failed to retrieve leaves" });
  }
};

// Get leave by ID
const getLeaveById = async (req, res) => {
  try {
    const organization = req.user.organization || DEFAULT_ORGANIZATION;
    
    const leave = await db.getOne(
      "SELECT id, user_id, leave_type, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, reason, status, submitted_to, rejection_reason, is_paid_leave, created_at, organization FROM leaves WHERE id = $1 AND organization = $2",
      [req.params.id, organization]
    );

    if (!leave) {
      logSecurityEvent("LEAVE_NOT_FOUND", { leaveId: req.params.id, userId: req.user.userId });
      return res.status(404).json({ error: "Leave request not found" });
    }

    logSecurityEvent("LEAVE_READ", { leaveId: req.params.id, userId: req.user.userId });

    res.json(leave);
  } catch (error) {
    console.error("❌ Get leave error:", error);
    res.status(500).json({ error: "Failed to retrieve leave" });
  }
};

// Create leave request
const createLeave = async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason, submitted_to, is_paid_leave } = req.body;
    const organization = req.user.organization || DEFAULT_ORGANIZATION;

    // Validate required fields
    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({ error: "Leave type, start date, and end date are required" });
    }

    // Validate dates
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: "Start date must be before end date" });
    }

    // Calculate number of days
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const timeDiff = endDate - startDate;
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end date

    // Get user's manager ID from JWT token
    let managerId = submitted_to;
    if (!managerId && req.user.managerid) {
      managerId = req.user.managerid;
    }

    // Default is_paid_leave to true if not provided
    const isPaidLeave = is_paid_leave !== undefined ? is_paid_leave : true;

    console.log(`📝 Creating leave - Type: ${leave_type}, Days: ${daysDiff}, Paid: ${isPaidLeave}, From: ${start_date} To: ${end_date}, Manager: ${managerId || 'None'}`);

    const result = await db.query(
      "INSERT INTO leaves (user_id, leave_type, start_date, end_date, reason, status, submitted_to, number_of_days, is_paid_leave, organization) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, user_id, leave_type, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, reason, status, submitted_to, number_of_days, is_paid_leave, created_at, organization",
      [req.user.userId, leave_type, start_date, end_date, reason || "", "pending", managerId || null, daysDiff, isPaidLeave, organization]
    );

    const leave = result.rows[0];

    console.log(`✅ Leave created - ID: ${leave.id}, Days: ${leave.number_of_days}, SubmittedTo: ${leave.submitted_to}`);
    logSecurityEvent("LEAVE_CREATED", { leaveId: leave.id, userId: req.user.userId, type: leave_type, days: daysDiff, submittedTo: managerId });

    res.status(201).json(leave);
  } catch (error) {
    console.error("❌ Create leave error:", error);
    res.status(500).json({ error: "Failed to create leave request" });
  }
};

// Update leave request
const updateLeave = async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason, status, rejection_reason } = req.body;

    // Calculate number of days if dates are provided
    let daysDiff = null;
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const timeDiff = endDate - startDate;
      daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    }

    let query = "UPDATE leaves SET ";
    const params = [];
    let paramCount = 1;

    if (leave_type) {
      query += `leave_type = $${paramCount}, `;
      params.push(leave_type);
      paramCount++;
    }
    if (start_date) {
      query += `start_date = $${paramCount}, `;
      params.push(start_date);
      paramCount++;
    }
    if (end_date) {
      query += `end_date = $${paramCount}, `;
      params.push(end_date);
      paramCount++;
    }
    if (reason !== undefined) {
      query += `reason = $${paramCount}, `;
      params.push(reason);
      paramCount++;
    }
    if (status) {
      query += `status = $${paramCount}, `;
      params.push(status);
      paramCount++;
    }
    if (rejection_reason !== undefined) {
      query += `rejection_reason = $${paramCount}, `;
      params.push(rejection_reason);
      paramCount++;
    }
    if (daysDiff) {
      query += `number_of_days = $${paramCount}, `;
      params.push(daysDiff);
      paramCount++;
    }

    query += `updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} AND user_id = $${paramCount + 1} AND organization = $${paramCount + 2} RETURNING id, user_id, leave_type, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, reason, status, submitted_to, rejection_reason, number_of_days, created_at, organization`;
    
    params.push(req.params.id, req.user.userId, req.user.organization);

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      logSecurityEvent("LEAVE_NOT_FOUND", { leaveId: req.params.id, userId: req.user.userId });
      return res.status(404).json({ error: "Leave request not found or unauthorized" });
    }

    logSecurityEvent("LEAVE_UPDATED", { leaveId: req.params.id, userId: req.user.userId, newStatus: status });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Update leave error:", error);
    res.status(500).json({ error: "Failed to update leave request" });
  }
};

// Delete leave request
const deleteLeave = async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM leaves WHERE id = $1 AND user_id = $2 AND organization = $3 AND status = 'pending' RETURNING id",
      [req.params.id, req.user.userId, req.user.organization]
    );

    if (result.rows.length === 0) {
      logSecurityEvent("LEAVE_NOT_FOUND", { leaveId: req.params.id, userId: req.user.userId });
      return res.status(404).json({ error: "Leave request not found, unauthorized, or cannot be deleted" });
    }

    logSecurityEvent("LEAVE_DELETED", { leaveId: req.params.id, userId: req.user.userId });

    res.json({ message: "Leave request deleted successfully" });
  } catch (error) {
    console.error("❌ Delete leave error:", error);
    res.status(500).json({ error: "Failed to delete leave request" });
  }
};

// Get leaves for a specific user (for managers)
const getLeavesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const organization = req.user.organization || DEFAULT_ORGANIZATION;

    const leaves = await db.getAll(
      "SELECT id, user_id, leave_type, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, reason, status, submitted_to, rejection_reason, number_of_days, is_paid_leave, created_at, organization FROM leaves WHERE user_id = $1 AND organization = $2 ORDER BY start_date DESC",
      [userId, organization]
    );

    console.log(`✅ Found ${leaves.length} leaves for user_id=${userId}`);
    logSecurityEvent("USER_LEAVES_READ", { requestedBy: req.user.userId, targetUser: userId, count: leaves.length });

    res.json(leaves);
  } catch (error) {
    console.error("❌ Get user leaves error:", error);
    res.status(500).json({ error: "Failed to retrieve user leaves" });
  }
};

// Get pending leaves for a manager (leaves awaiting approval)
const getPendingLeaves = async (req, res) => {
  try {
    const organization = req.user.organization || DEFAULT_ORGANIZATION;
    
    // Get all leaves with status 'pending' that have no submitted_to yet, or are submitted to this manager
    const leaves = await db.getAll(
      `SELECT 
        l.id, 
        l.user_id, 
        u.name as user_name,
        u.email as user_email,
        l.leave_type, 
        TO_CHAR(l.start_date, 'YYYY-MM-DD') as start_date, 
        TO_CHAR(l.end_date, 'YYYY-MM-DD') as end_date, 
        l.reason, 
        l.status, 
        l.number_of_days,
        l.is_paid_leave,
        l.created_at, 
        l.organization 
      FROM leaves l 
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'pending' 
        AND l.organization = $1 
        AND (l.submitted_to IS NULL OR l.submitted_to = $2)
      ORDER BY l.created_at DESC`,
      [organization, req.user.userId]
    );

    console.log(`✅ Found ${leaves.length} pending leaves for manager ${req.user.userId}`);
    logSecurityEvent("PENDING_LEAVES_READ", { managerId: req.user.userId, count: leaves.length });

    res.json(leaves);
  } catch (error) {
    console.error("❌ Get pending leaves error:", error);
    res.status(500).json({ error: "Failed to retrieve pending leaves" });
  }
};

// Approve leave (for managers)
const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "UPDATE leaves SET status = 'approved', submitted_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND organization = $3 RETURNING id, user_id, leave_type, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, reason, status, submitted_to, number_of_days, created_at, organization",
      [req.user.userId, id, req.user.organization]
    );

    if (result.rows.length === 0) {
      logSecurityEvent("LEAVE_NOT_FOUND", { leaveId: id, managerId: req.user.userId });
      return res.status(404).json({ error: "Leave request not found" });
    }

    logSecurityEvent("LEAVE_APPROVED", { leaveId: id, approvedBy: req.user.userId });

    res.json({ message: "Leave approved successfully", leave: result.rows[0] });
  } catch (error) {
    console.error("❌ Approve leave error:", error);
    res.status(500).json({ error: "Failed to approve leave" });
  }
};

// Reject leave (for managers)
const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const result = await db.query(
      "UPDATE leaves SET status = 'rejected', rejection_reason = $1, submitted_to = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND organization = $4 RETURNING id, user_id, leave_type, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, reason, status, submitted_to, rejection_reason, number_of_days, created_at, organization",
      [rejection_reason, req.user.userId, id, req.user.organization]
    );

    if (result.rows.length === 0) {
      logSecurityEvent("LEAVE_NOT_FOUND", { leaveId: id, managerId: req.user.userId });
      return res.status(404).json({ error: "Leave request not found" });
    }

    logSecurityEvent("LEAVE_REJECTED", { leaveId: id, rejectedBy: req.user.userId });

    res.json({ message: "Leave rejected successfully", leave: result.rows[0] });
  } catch (error) {
    console.error("❌ Reject leave error:", error);
    res.status(500).json({ error: "Failed to reject leave" });
  }
};

module.exports = {
  getAllLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
  getLeavesByUserId,
  getPendingLeaves,
  approveLeave,
  rejectLeave
};
