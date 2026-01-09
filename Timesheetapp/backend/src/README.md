# Backend Folder Structure

## Overview
The backend has been refactored from a single `server.js` file to a proper Express folder structure for better maintainability and scalability.

## Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   └── constants.js           # Configuration constants
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic (register, login)
│   │   ├── usersController.js     # User management logic
│   │   ├── projectsController.js  # Project management logic
│   │   └── timeEntriesController.js # Time entry logic
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification middleware
│   │   └── securityMiddleware.js  # CORS, rate limiting, security headers
│   ├── routes/
│   │   ├── authRoutes.js          # Authentication endpoints
│   │   ├── usersRoutes.js         # User management endpoints
│   │   ├── projectsRoutes.js      # Project management endpoints
│   │   └── timeEntriesRoutes.js   # Time entry endpoints
│   ├── utils/
│   │   ├── logger.js              # Security logging utility
│   │   └── validators.js          # Input validation functions
│   └── server.js                  # Main server file
├── db.js                          # Database connection and queries
├── .env                           # Environment variables
├── package.json                   # Dependencies
└── README.md                      # This file
```

## Key Features

### 1. **Controllers** (`src/controllers/`)
Handles business logic for each resource:
- `authController.js`: Register, login, get current user
- `usersController.js`: CRUD operations for users, assign manager
- `projectsController.js`: CRUD operations for projects
- `timeEntriesController.js`: CRUD operations for time entries

### 2. **Routes** (`src/routes/`)
Defines API endpoints for each resource:
- `/register` → POST
- `/login` → POST
- `/me` → GET (current user)
- `/users` → GET, POST, PUT, DELETE
- `/projects` → GET, POST, PUT, DELETE
- `/time-entries` → GET, POST, PUT, DELETE
- `/my-time-entries` → GET (user's entries)

### 3. **Middleware** (`src/middleware/`)
- **authMiddleware.js**: JWT token verification
- **securityMiddleware.js**: CORS, rate limiting, security headers

### 4. **Utilities** (`src/utils/`)
- **validators.js**: Email, password, and user input validation
- **logger.js**: Security event logging

### 5. **Config** (`src/config/`)
- **constants.js**: Configuration constants like password requirements, rate limits, JWT expiration

## Running the Server

```bash
# Start the server
npm start

# Or in development mode
npm run dev

# Server runs on http://localhost:3001
```

## Environment Variables

Required `.env` file variables:
```
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:8080
DATABASE_URL=postgresql://user:password@localhost/timesheet_db
```

## API Endpoints Summary

### Authentication
- `POST /register` - Register a new user
- `POST /login` - Login and get JWT token
- `GET /me` - Get current user (requires token)

### Users
- `GET /users` - Get all users from organization (requires token)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `PUT /users/:id/assign-manager` - Assign manager to user

### Projects
- `GET /projects` - Get all projects from organization
- `GET /projects/:id` - Get project by ID
- `POST /projects` - Create new project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Time Entries
- `GET /time-entries` - Get all time entries from organization
- `GET /my-time-entries` - Get user's time entries
- `POST /time-entries` - Create new time entry
- `PUT /time-entries/:id` - Update time entry
- `DELETE /time-entries/:id` - Delete time entry

## Organization-Based Data Isolation

All endpoints are filtered by organization:
- Users can only see users from their organization
- Users can only see projects from their organization
- Users can only see time entries from their organization

Default organization: `'Default Organization'`

## Security Features

1. **JWT Authentication**: All endpoints (except register/login) require valid JWT token
2. **Rate Limiting**: 
   - Login: 5 attempts per 15 minutes
   - Register: 10 attempts per hour
3. **Password Validation**:
   - Minimum 8 characters
   - Uppercase and lowercase letters
   - Numbers
   - Special characters
4. **Security Headers**: XSS protection, clickjacking prevention, etc.
5. **CORS**: Configured for frontend origins

## Adding New Endpoints

To add a new endpoint:

1. Create a new file in `src/controllers/` (e.g., `approvalsController.js`)
2. Create a new file in `src/routes/` (e.g., `approvalsRoutes.js`)
3. Import the routes in `src/server.js`:
   ```javascript
   const approvalsRoutes = require('./routes/approvalsRoutes');
   app.use('/approvals', approvalsRoutes);
   ```

## Migration from Old Structure

The old `server.js` file still exists at the root for reference. The new structure maintains backward compatibility by keeping all endpoint paths the same.
