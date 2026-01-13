const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  console.log('🔍 Checking admin access');
  console.log('User role:', req.user?.role);
  console.log('Is admin?:', req.user?.role === 'admin');
  
  if (req.user?.role !== 'admin') {
    console.log('❌ Access denied - not admin');
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  console.log('✅ Admin access granted');
  next();
};

// Get all salaries (admin only)
router.get('/', verifyToken, isAdmin, salaryController.getAllSalaries);

// Get salary by ID
router.get('/:id', verifyToken, salaryController.getSalaryById);

// Get salary by user ID
router.get('/user/:userId', verifyToken, salaryController.getSalaryByUserId);

// Create new salary (admin only)
router.post('/', verifyToken, isAdmin, salaryController.createSalary);

// Update salary (admin only)
router.put('/:id', verifyToken, isAdmin, salaryController.updateSalary);

// Delete salary (admin only)
router.delete('/:id', verifyToken, isAdmin, salaryController.deleteSalary);

// Get salaries by organization
router.get('/org/all', verifyToken, salaryController.getSalariesByOrganization);

module.exports = router;
