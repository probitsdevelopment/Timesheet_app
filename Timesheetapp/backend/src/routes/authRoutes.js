const express = require('express');
const { register, login, getCurrentUser } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/securityMiddleware');

const router = express.Router();

// POST /api/auth/register
router.post('/register', registerLimiter, register);

// POST /api/auth/login
router.post('/login', loginLimiter, login);

// GET /api/auth/me
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;
