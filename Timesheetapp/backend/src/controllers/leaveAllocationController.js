const db = require('../../db');

// Get leave balance for a user
const getLeaveBalance = async (req, res) => {
  try {
    const userId = req.user?.userId || req.params.userId;
    const currentYear = new Date().getFullYear();

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`🔍 Fetching leave balance for user ${userId} (${currentYear})`);

    // Get allocated days for this user
    const allocatedResult = await db.query(
      `SELECT SUM(allocated_days) as total_allocated
       FROM leave_allocation
       WHERE user_id = $1 AND year = $2`,
      [userId, currentYear]
    );

    const totalAllocated = allocatedResult.rows[0]?.total_allocated || 0;

    // Get used leaves (sum of approved leave days)
    const usedResult = await db.query(
      `SELECT SUM(number_of_days) as used_days
       FROM leaves
       WHERE user_id = $1 AND status = 'approved'`,
      [userId]
    );

    const usedLeaves = usedResult.rows[0]?.used_days || 0;
    const remainingLeaves = totalAllocated - usedLeaves;

    // Get breakdown by leave type
    const typeBreakdownResult = await db.query(
      `SELECT 
         la.leave_type,
         la.allocated_days,
         COALESCE(SUM(l.number_of_days), 0) as used_days,
         la.allocated_days - COALESCE(SUM(l.number_of_days), 0) as remaining_days
       FROM leave_allocation la
       LEFT JOIN leaves l ON la.user_id = l.user_id AND la.leave_type = l.leave_type AND l.status = 'approved'
       WHERE la.user_id = $1 AND la.year = $2
       GROUP BY la.leave_type, la.allocated_days`,
      [userId, currentYear]
    );

    const byType = typeBreakdownResult.rows.reduce((acc, row) => {
      acc[row.leave_type] = {
        allocated: row.allocated_days,
        used: parseInt(row.used_days),
        remaining: parseInt(row.remaining_days),
      };
      return acc;
    }, {});

    console.log('✅ Leave balance calculated:', { totalAllocated, usedLeaves, remainingLeaves });

    res.json({
      totalAllocated,
      usedLeaves,
      remainingLeaves,
      year: currentYear,
      byType,
    });
  } catch (error) {
    console.error('❌ Error fetching leave balance:', error);
    res.status(500).json({ error: 'Failed to fetch leave balance' });
  }
};

// Get all leave allocations (admin only)
const getAllAllocations = async (req, res) => {
  try {
    console.log('📋 Fetching all leave allocations');

    const result = await db.query(
      `SELECT 
         la.id,
         la.user_id,
         u.name,
         u.email,
         la.leave_type,
         la.allocated_days,
         la.year,
         la.created_at
       FROM leave_allocation la
       JOIN users u ON la.user_id = u.id
       ORDER BY la.year DESC, u.name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching allocations:', error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
};

// Update leave allocation for a user (admin only)
const updateAllocation = async (req, res) => {
  try {
    const { userId, leaveType, allocatedDays, year } = req.body;

    if (!userId || !leaveType || allocatedDays === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`✏️ Updating allocation: user ${userId}, ${leaveType}, ${allocatedDays} days`);

    const result = await db.query(
      `INSERT INTO leave_allocation (user_id, leave_type, allocated_days, year, organization)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, leave_type, year, organization) 
       DO UPDATE SET allocated_days = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, leaveType, allocatedDays, year || new Date().getFullYear(), req.user?.organization]
    );

    console.log('✅ Allocation updated successfully');

    res.json({
      message: 'Allocation updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Error updating allocation:', error);
    res.status(500).json({ error: 'Failed to update allocation' });
  }
};

// Bulk allocate leave days to all organization users (admin only)
const bulkAllocateLeaves = async (req, res) => {
  try {
    const { leaveType, allocatedDays, year } = req.body;
    const adminUserId = req.user?.userId;

    if (!leaveType || allocatedDays === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!adminUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`🎁 Bulk allocating: ${leaveType}, ${allocatedDays} days for year ${year}`);

    // Get admin's organization
    const adminOrgResult = await db.query(
      `SELECT organization FROM users WHERE id = $1`,
      [adminUserId]
    );

    if (adminOrgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    const organization = adminOrgResult.rows[0].organization;
    const currentYear = year || new Date().getFullYear();

    console.log(`📋 Allocating to organization: ${organization}`);

    // Get all active users in the organization (except admins)
    const usersResult = await db.query(
      `SELECT id FROM users 
       WHERE organization = $1 AND role != 'admin'`,
      [organization]
    );

    if (usersResult.rows.length === 0) {
      return res.json({
        message: 'No eligible users found for allocation',
        allocatedCount: 0,
      });
    }

    const userIds = usersResult.rows.map(u => u.id);
    console.log(`👥 Found ${userIds.length} eligible users`);

    // Bulk insert or update leave allocations
    let allocatedCount = 0;
    for (const userId of userIds) {
      const result = await db.query(
        `INSERT INTO leave_allocation (user_id, leave_type, allocated_days, year, organization)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, leave_type, year, organization) 
         DO UPDATE SET allocated_days = $3, updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [userId, leaveType, allocatedDays, currentYear, organization]
      );
      if (result.rows.length > 0) {
        allocatedCount++;
      }
    }

    console.log(`✅ Bulk allocation complete: ${allocatedCount} users updated`);

    res.json({
      message: 'Leaves allocated to all users',
      leaveType,
      allocatedDays,
      year: currentYear,
      allocatedCount,
      totalUsers: userIds.length,
    });
  } catch (error) {
    console.error('❌ Error in bulk allocation:', error);
    res.status(500).json({ error: 'Failed to allocate leaves' });
  }
};

module.exports = {
  getLeaveBalance,
  getAllAllocations,
  updateAllocation,
  bulkAllocateLeaves,
};
