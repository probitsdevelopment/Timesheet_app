const express = require('express');
const { getAllTimeEntries, getUserTimeEntries, getEntriesByUserId, createTimeEntry, updateTimeEntry, deleteTimeEntry } = require('../controllers/timeEntriesController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/time-entries
router.get('/', verifyToken, getAllTimeEntries);

// GET /api/time-entries/user/:userId (get entries for a specific user)
router.get('/user/:userId', verifyToken, getEntriesByUserId);

// GET /api/my-time-entries
router.get('/my', verifyToken, getUserTimeEntries);

// POST /api/time-entries
router.post('/', verifyToken, createTimeEntry);

// PUT /api/time-entries/:id
router.put('/:id', verifyToken, updateTimeEntry);

// DELETE /api/time-entries/:id
router.delete('/:id', verifyToken, deleteTimeEntry);

module.exports = router;
