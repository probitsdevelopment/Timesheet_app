const express = require('express');
const router = express.Router();
const holidaysController = require('../controllers/holidaysController');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can perform this action' });
  }
  next();
};

// Get all holidays (accessible to all authenticated users)
router.get('/', verifyToken, holidaysController.getAllHolidays);

// Get single holiday by ID (accessible to all authenticated users)
router.get('/:id', verifyToken, holidaysController.getHolidayById);

// Create holiday (Admin only)
router.post('/', verifyToken, isAdmin, holidaysController.createHoliday);

// Update holiday (Admin only)
router.put('/:id', verifyToken, isAdmin, holidaysController.updateHoliday);

// Delete holiday (Admin only)
router.delete('/:id', verifyToken, isAdmin, holidaysController.deleteHoliday);

module.exports = router;
