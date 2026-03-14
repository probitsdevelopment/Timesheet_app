const db = require('../../db');
const { logSecurityEvent } = require('../utils/logger');
const { DEFAULT_ORGANIZATION } = require('../config/constants');

// Calculate working days in a month (all days as working days)
const calculateWorkingDays = (year, month) => {
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();
  
  console.log(`📅 Calculating working days for ${year}-${String(month).padStart(2, '0')}: ${totalDays} days`);
  
  return totalDays;
};

// Process salary for an employee in a given month
const processSalary = async (req, res) => {
  try {
    const { userId, month } = req.body;
    const organization = req.user.organization || DEFAULT_ORGANIZATION;
    const processedBy = req.user.userId;

    if (!userId || !month) {
      return res.status(400).json({ error: 'userId and month are required' });
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Month must be in YYYY-MM format' });
    }

    const [year, monthNum] = month.split('-').map(Number);

    console.log(`💰 Processing salary for user ${userId}, month ${month}`);

    // Step 1: Get user's basic salary
    const salaryResult = await db.query(
      'SELECT basic_salary FROM salaries WHERE user_id = $1 AND organization = $2',
      [userId, organization]
    );

    if (!salaryResult.rows[0]) {
      return res.status(404).json({ error: 'No salary record found for this user' });
    }

    const basicSalary = parseFloat(salaryResult.rows[0].basic_salary);

    // Step 2: Calculate working days
    const workingDays = calculateWorkingDays(year, monthNum);
    const perDaySalary = basicSalary / workingDays;

    // Step 3: Check timesheet approval
    const timesheetResult = await db.query(
      `SELECT status FROM timesheets
       WHERE user_id = $1 AND month = $2 AND organization = $3`,
      [userId, month, organization]
    );

    const timesheetApproved = timesheetResult.rows[0]?.status === 'approved';

    console.log(`✅ Timesheet Approved: ${timesheetApproved}`);

    // Step 4: Get allocated leaves for this user from leave_allocation (set by admin)
    const allocationResult = await db.query(
      `SELECT COALESCE(SUM(allocated_days), 0) as total_allocated
       FROM leave_allocation
       WHERE user_id = $1 AND year = $2 AND organization = $3`,
      [userId, year, organization]
    );
    const totalAllocated = parseInt(allocationResult.rows[0]?.total_allocated || 0);

    // Step 5: Count total approved leaves used in this year (up to and including this month)
    const yearlyUsedResult = await db.query(
      `SELECT COALESCE(SUM(number_of_days), 0) as used_days
       FROM leaves
       WHERE user_id = $1
       AND status = 'approved'
       AND EXTRACT(YEAR FROM start_date) = $2
       AND organization = $3`,
      [userId, year, organization]
    );
    const totalUsedInYear = parseInt(yearlyUsedResult.rows[0]?.used_days || 0);

    // Step 6: Count approved leaves in this specific month
    const leavesResult = await db.query(
      `SELECT COUNT(*) as total_leaves, COALESCE(SUM(number_of_days), 0) as total_days
       FROM leaves
       WHERE user_id = $1
       AND status = 'approved'
       AND DATE_TRUNC('month', start_date) = DATE_TRUNC('month', $2::date)
       AND organization = $3`,
      [userId, `${month}-01`, organization]
    );

    const totalLeaves = parseInt(leavesResult.rows[0]?.total_leaves || 0);
    const totalLeaveDays = parseInt(leavesResult.rows[0]?.total_days || 0);

    // Step 7: Calculate unpaid leaves based on allocation
    // Leaves used before this month
    const usedBeforeThisMonth = totalUsedInYear - totalLeaveDays;
    // Remaining allocation before this month's leaves
    const remainingAllocation = Math.max(0, totalAllocated - usedBeforeThisMonth);
    // How many of this month's leaves are covered by allocation
    const paidLeavesThisMonth = Math.min(totalLeaveDays, remainingAllocation);
    // Leaves exceeding allocation = loss of pay
    const unpaidLeaves = Math.max(0, totalLeaveDays - paidLeavesThisMonth);
    const deduction = unpaidLeaves * perDaySalary;

    // Step 8: Calculate final salary
    const finalSalary = basicSalary - deduction;

    // Step 9: Determine status
    const status = timesheetApproved ? 'PROCESSED' : 'HOLD';

    console.log(`📊 Calculation:
      Basic Salary: ₹${basicSalary}
      Working Days: ${workingDays}
      Per Day: ₹${perDaySalary.toFixed(2)}
      Yearly Allocation: ${totalAllocated} days
      Used in Year: ${totalUsedInYear} days
      This Month Leaves: ${totalLeaveDays} days
      Paid (from allocation): ${paidLeavesThisMonth} days
      Unpaid (loss of pay): ${unpaidLeaves} days
      Deduction: ₹${deduction.toFixed(2)}
      Final Salary: ₹${finalSalary.toFixed(2)}
      Status: ${status}`);

    // Step 8: Save to salary_processing table
    const result = await db.query(
      `INSERT INTO salary_processing 
       (user_id, month, year, basic_salary, working_days, total_leaves, unpaid_leaves, 
        deduction, final_salary, timesheet_approved, status, processed_by, organization)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (user_id, month, year, organization) 
       DO UPDATE SET 
         year = $3,
         basic_salary = $4,
         working_days = $5,
         total_leaves = $6,
         unpaid_leaves = $7,
         deduction = $8,
         final_salary = $9,
         timesheet_approved = $10,
         status = $11,
         processed_by = $12,
         processed_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, month, year, basicSalary, workingDays, totalLeaves, unpaidLeaves, 
       deduction, finalSalary, timesheetApproved, status, processedBy, organization]
    );

    const processedSalary = result.rows[0];

    console.log(`✅ Salary processed - ID: ${processedSalary.id}, Status: ${status}`);
    logSecurityEvent('SALARY_PROCESSED', { 
      userId, 
      month, 
      finalSalary, 
      status,
      processedBy 
    });

    res.json({
      id: processedSalary.id,
      userId: processedSalary.user_id,
      month: processedSalary.month,
      basicSalary: parseFloat(processedSalary.basic_salary),
      workingDays: processedSalary.working_days,
      totalLeaves: processedSalary.total_leaves,
      yearlyAllocated: totalAllocated,
      yearlyUsed: totalUsedInYear,
      paidLeavesThisMonth: paidLeavesThisMonth,
      unpaidLeaves: processedSalary.unpaid_leaves,
      deduction: parseFloat(processedSalary.deduction),
      finalSalary: parseFloat(processedSalary.final_salary),
      timesheet_approved: processedSalary.timesheet_approved,
      status: processedSalary.status,
      processedAt: processedSalary.processed_at
    });
  } catch (error) {
    console.error('❌ Salary processing error:', error);
    res.status(500).json({ error: 'Failed to process salary', details: error.message });
  }
};

// Get processed salary for a specific user and month
const getSalaryByUserAndMonth = async (req, res) => {
  try {
    const { userId, month } = req.params;
    const organization = req.user.organization || DEFAULT_ORGANIZATION;

    const result = await db.query(
      `SELECT * FROM salary_processing 
       WHERE user_id = $1 AND month = $2 AND organization = $3`,
      [userId, month, organization]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Salary record not found' });
    }

    const salary = result.rows[0];

    res.json({
      id: salary.id,
      userId: salary.user_id,
      month: salary.month,
      basicSalary: parseFloat(salary.basic_salary),
      workingDays: salary.working_days,
      totalLeaves: salary.total_leaves,
      paidLeavesAllowed: salary.paid_leaves_allowed || 0,
      unpaidLeaves: salary.unpaid_leaves,
      deduction: parseFloat(salary.deduction),
      finalSalary: parseFloat(salary.final_salary),
      timesheet_approved: salary.timesheet_approved,
      status: salary.status,
      processedAt: salary.processed_at
    });
  } catch (error) {
    console.error('❌ Error fetching salary:', error);
    res.status(500).json({ error: 'Failed to fetch salary' });
  }
};

// Get all salaries for a specific month
const getSalariesByMonth = async (req, res) => {
  try {
    const { month } = req.query;
    const organization = req.user.organization || DEFAULT_ORGANIZATION;

    if (!month) {
      return res.status(400).json({ error: 'month parameter is required (YYYY-MM)' });
    }

    const result = await db.query(
      `SELECT sp.*, u.name, u.email
       FROM salary_processing sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.month = $1 AND sp.organization = $2
       ORDER BY u.name ASC`,
      [month, organization]
    );

    const salaries = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.name,
      userEmail: row.email,
      month: row.month,
      basicSalary: parseFloat(row.basic_salary),
      workingDays: row.working_days,
      totalLeaves: row.total_leaves,
      paidLeavesAllowed: row.paid_leaves_allowed || getPaidLeavesAllowed(),
      unpaidLeaves: row.unpaid_leaves,
      deduction: parseFloat(row.deduction),
      finalSalary: parseFloat(row.final_salary),
      timesheet_approved: row.timesheet_approved,
      status: row.status,
      processedAt: row.processed_at
    }));

    res.json({
      month,
      total: salaries.length,
      salaries
    });
  } catch (error) {
    console.error('❌ Error fetching salaries:', error);
    res.status(500).json({ error: 'Failed to fetch salaries' });
  }
};

// Get salary processing history for an employee
const getSalaryHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const organization = req.user.organization || DEFAULT_ORGANIZATION;

    const result = await db.query(
      `SELECT * FROM salary_processing
       WHERE user_id = $1 AND organization = $2
       ORDER BY month DESC
       LIMIT 12`,
      [userId, organization]
    );

    const salaries = result.rows.map(row => ({
      id: row.id,
      month: row.month,
      basicSalary: parseFloat(row.basic_salary),
      workingDays: row.working_days,
      totalLeaves: row.total_leaves,
      paidLeavesAllowed: row.paid_leaves_allowed || getPaidLeavesAllowed(),
      unpaidLeaves: row.unpaid_leaves,
      deduction: parseFloat(row.deduction),
      finalSalary: parseFloat(row.final_salary),
      timesheet_approved: row.timesheet_approved,
      status: row.status,
      processedAt: row.processed_at
    }));

    res.json(salaries);
  } catch (error) {
    console.error('❌ Error fetching salary history:', error);
    res.status(500).json({ error: 'Failed to fetch salary history' });
  }
};

module.exports = {
  processSalary,
  getSalaryByUserAndMonth,
  getSalariesByMonth,
  getSalaryHistory,
  calculateWorkingDays
};
