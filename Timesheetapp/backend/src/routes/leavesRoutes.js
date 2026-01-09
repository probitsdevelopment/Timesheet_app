const express = require('express');
const {
  getAllLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
  getLeavesByUserId,
  getPendingLeaves,
  approveLeave,
  rejectLeave
} = require('../controllers/leavesController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /leaves/pending - Get pending leaves for current manager
router.get('/pending/all', verifyToken, getPendingLeaves);

// GET /leaves/user/:userId - Get leaves for a specific user (for managers) - MUST be before /:id
router.get('/user/:userId', verifyToken, getLeavesByUserId);

// GET /leaves - Get all leaves for current user
router.get('/', verifyToken, getAllLeaves);

// GET /leaves/:id - Get leave by ID
router.get('/:id', verifyToken, getLeaveById);

// POST /leaves - Create new leave request
router.post('/', verifyToken, createLeave);

// PUT /leaves/:id - Update leave request
router.put('/:id', verifyToken, updateLeave);

// DELETE /leaves/:id - Delete leave request
router.delete('/:id', verifyToken, deleteLeave);

// POST /leaves/:id/approve - Approve leave (for managers)
router.post('/:id/approve', verifyToken, approveLeave);

// POST /leaves/:id/reject - Reject leave (for managers)
router.post('/:id/reject', verifyToken, rejectLeave);

module.exports = router;
