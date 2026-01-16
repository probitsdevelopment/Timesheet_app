const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const salaryProcessingController = require('../controllers/salaryProcessingController');

console.log('📋 Loading salary processing routes...');

// All routes require authentication
router.use((req, res, next) => {
  console.log(`🔵 Salary Processing Route Hit: ${req.method} ${req.path}`);
  console.log(`📍 Full URL: ${req.baseUrl}${req.path}`);
  console.log(`🔑 Auth Header: ${req.headers.authorization ? 'Present' : 'Missing'}`);
  verifyToken(req, res, next);
});

// Process salary for an employee (Admin/Manager only)
router.post('/process', (req, res, next) => {
  console.log('✅ POST /process route handler called');
  salaryProcessingController.processSalary(req, res);
});

// Get salary for a specific user and month
router.get('/user/:userId/:month', salaryProcessingController.getSalaryByUserAndMonth);

// Get all salaries for a specific month
router.get('/month', salaryProcessingController.getSalariesByMonth);

// Get salary history for a user (last 12 months)
router.get('/history/:userId', salaryProcessingController.getSalaryHistory);

module.exports = router;
