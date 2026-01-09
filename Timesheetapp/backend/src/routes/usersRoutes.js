const express = require('express');
const { getAllUsers, getUserById, createUser, updateUser, deleteUser, assignManager } = require('../controllers/usersController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/users
router.get('/', verifyToken, getAllUsers);

// GET /api/users/:id
router.get('/:id', verifyToken, getUserById);

// POST /api/users
router.post('/', verifyToken, createUser);

// PUT /api/users/:id
router.put('/:id', verifyToken, updateUser);

// DELETE /api/users/:id
router.delete('/:id', verifyToken, deleteUser);

// PUT /api/users/:id/assign-manager
router.put('/:id/assign-manager', verifyToken, assignManager);

module.exports = router;
