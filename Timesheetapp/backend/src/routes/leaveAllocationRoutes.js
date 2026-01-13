const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getLeaveBalance,
  getAllAllocations,
  updateAllocation,
} = require('../controllers/leaveAllocationController');

const router = express.Router();

// Get leave balance for current user
router.get('/balance', verifyToken, getLeaveBalance);

// Get leave balance for specific user (admin only)
router.get('/balance/:userId', verifyToken, (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view other users leave balance' });
  }
  next();
}, getLeaveBalance);

// Get all allocations (admin only)
router.get('/', verifyToken, (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view all allocations' });
  }
  next();
}, getAllAllocations);

// Update allocation (admin only)
router.put('/', verifyToken, (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update allocations' });
  }
  next();
}, updateAllocation);

module.exports = router;
