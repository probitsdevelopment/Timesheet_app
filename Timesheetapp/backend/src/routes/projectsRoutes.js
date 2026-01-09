const express = require('express');
const { getAllProjects, getProjectById, createProject, updateProject, deleteProject } = require('../controllers/projectsController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/projects
router.get('/', verifyToken, getAllProjects);

// GET /api/projects/:id
router.get('/:id', verifyToken, getProjectById);

// POST /api/projects
router.post('/', verifyToken, createProject);

// PUT /api/projects/:id
router.put('/:id', verifyToken, updateProject);

// DELETE /api/projects/:id
router.delete('/:id', verifyToken, deleteProject);

module.exports = router;
