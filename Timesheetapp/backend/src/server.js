const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import middleware
const { corsConfig, securityHeaders } = require('./middleware/securityMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const projectsRoutes = require('./routes/projectsRoutes');
const timeEntriesRoutes = require('./routes/timeEntriesRoutes');
const timesheetsRoutes = require('./routes/timesheetsRoutes');
const leavesRoutes = require('./routes/leavesRoutes');
const leaveAllocationRoutes = require('./routes/leaveAllocationRoutes');
const holidaysRoutes = require('./routes/holidaysRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const salaryProcessingRoutes = require('./routes/salaryProcessingRoutes');

// ==================== GLOBAL MIDDLEWARE ====================

// CORS - MUST be first middleware!
app.use(require('cors')(corsConfig));

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security headers
app.use(securityHeaders);

// ==================== HEALTH CHECK ====================

app.get('/', (req, res) => {
  res.json({ message: "Express server is running", port: PORT });
});

// ==================== API ROUTES ====================

// CORS middleware for all routes
const corsMiddleware = require('cors')(corsConfig);

// Authentication routes - with explicit CORS
app.options('/register', corsMiddleware);
app.post('/register', corsMiddleware, require('./middleware/securityMiddleware').registerLimiter, require('./controllers/authController').register);

app.options('/login', corsMiddleware);
app.post('/login', corsMiddleware, require('./middleware/securityMiddleware').loginLimiter, require('./controllers/authController').login);

app.options('/me', corsMiddleware);
app.get('/me', corsMiddleware, require('./middleware/authMiddleware').verifyToken, require('./controllers/authController').getCurrentUser);

// Users routes
app.use('/users', usersRoutes);

// Projects routes
app.use('/projects', projectsRoutes);

// Time entries routes
app.use('/time-entries', timeEntriesRoutes);

// Timesheets routes
app.use('/timesheets', timesheetsRoutes);

// Leaves routes
app.use('/leaves', leavesRoutes);
// Leave allocation routes
app.use('/leave-allocation', leaveAllocationRoutes);

// Holidays routes
app.use('/holidays', holidaysRoutes);

// Salaries routes
app.use('/salaries', salaryRoutes);

// Salary processing routes
app.use('/salary-processing', salaryProcessingRoutes);

// Legacy route support for /api/my-time-entries
const { getUserTimeEntries } = require('./controllers/timeEntriesController');
const { verifyToken } = require('./middleware/authMiddleware');
app.get('/my-time-entries', verifyToken, getUserTimeEntries);

// ==================== ERROR HANDLING ====================

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: "Internal server error" });
});



app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n✅ Express server running on http://localhost:${PORT}`);
  console.log(`🗄️  PostgreSQL configured`);
  console.log(`🔒 JWT Secret configured: ${process.env.JWT_SECRET ? "YES" : "NO"}`);
  console.log(`📦 API Version: 1.0.0 - Timesheet Application\n`);
});

module.exports = app;
