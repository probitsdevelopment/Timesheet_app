const express = require('express');
require('dotenv').config();
const path = require('path');

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
const corsMiddleware = require('cors')(corsConfig);
app.use(corsMiddleware);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security headers
app.use(securityHeaders);

// ✅ Debug middleware to log CORS headers
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const origin = req.headers.origin;
    const method = req.method;
    if (method === 'OPTIONS' || origin) {
      console.log(`📍 ${method} ${req.path} | Origin: ${origin || '(none)'}`);
    }
  }
  next();
});

// ✅ Serve frontend static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// ==================== HEALTH CHECK ====================

app.get('/', (req, res) => {
  res.json({ message: "Express server is running", port: PORT });
});

// ==================== API ROUTES ====================

// Authentication routes - now fully handled by CORS middleware
app.post('/register', require('./middleware/securityMiddleware').registerLimiter, require('./controllers/authController').register);

app.post('/login', require('./middleware/securityMiddleware').loginLimiter, require('./controllers/authController').login);

app.get('/me', require('./middleware/authMiddleware').verifyToken, require('./controllers/authController').getCurrentUser);

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

// ✅ SPA fallback - serve index.html for all non-API routes
// This allows React Router to handle client-side routing
app.get('*', (req, res) => {
  // Only redirect if not an API call
  if (!req.path.startsWith('/register') && 
      !req.path.startsWith('/login') && 
      !req.path.startsWith('/me') &&
      !req.path.startsWith('/users') &&
      !req.path.startsWith('/projects') &&
      !req.path.startsWith('/time-entries') &&
      !req.path.startsWith('/timesheets') &&
      !req.path.startsWith('/leaves') &&
      !req.path.startsWith('/leave-allocation') &&
      !req.path.startsWith('/holidays') &&
      !req.path.startsWith('/salaries') &&
      !req.path.startsWith('/salary-processing') &&
      !req.path.startsWith('/my-time-entries')) {
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }
  // Let API routes continue to error handler
  next();
});

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
