const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getAllTimesheets,
  getTimesheetById,
  createTimesheet,
  updateTimesheet,
  deleteTimesheet
} = require('../controllers/timesheetsController');

// GET all timesheets
router.get('/', verifyToken, getAllTimesheets);

// GET timesheet by ID
router.get('/:id', verifyToken, getTimesheetById);

// CREATE timesheet
router.post('/', verifyToken, createTimesheet);

// UPDATE timesheet
router.put('/:id', verifyToken, updateTimesheet);

// DELETE timesheet
router.delete('/:id', verifyToken, deleteTimesheet);

module.exports = router;
