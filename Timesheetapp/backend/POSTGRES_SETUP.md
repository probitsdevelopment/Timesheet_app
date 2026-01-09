# PostgreSQL Setup Guide

## Step 1: Install PostgreSQL (Windows)

1. Download from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Set password for `postgres` user (remember this!)
4. Keep default port: `5432`
5. Complete installation

Verify installation:
```powershell
psql --version
```

## Step 2: Create Database and Tables

Open PowerShell as Administrator:

```powershell
# Connect to PostgreSQL
psql -U postgres

# In psql prompt, run the setup.sql file
\i 'D:/Timesheet/backend/setup.sql'

# Or manually create database:
CREATE DATABASE timesheet_db;
\c timesheet_db

# Then run all the CREATE TABLE commands from setup.sql
```

## Step 3: Update .env File

The .env file has already been updated with:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=timesheet_db
DB_USER=postgres
DB_PASSWORD=your-postgres-password  <- UPDATE THIS
```

**Replace `your-postgres-password` with your PostgreSQL password!**

## Step 4: Start Backend Server

```powershell
cd d:\Timesheet\backend
npm start
```

You should see:
```
✅ Express server running on http://localhost:3001
✅ Connected to PostgreSQL database
🗄️  PostgreSQL configured
🔒 JWT Secret configured: YES
```

## Step 5: Test the API

### Register a user:
```bash
POST http://localhost:3001/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password@123"
}
```

### Login:
```bash
POST http://localhost:3001/login
Content-Type: application/json

{
  "emailOrUsername": "testuser",
  "password": "Password@123"
}
```

### View all users (requires JWT token):
```bash
GET http://localhost:3001/users
Authorization: Bearer <your_jwt_token>
```

## Endpoints Available

### Authentication
- `POST /register` - Create new user
- `POST /login` - Login user
- `GET /me` - Get current user (requires token)

### Users
- `GET /users` - Get all users (requires token)
- `GET /users/:id` - Get user by ID (requires token)

### Projects
- `GET /projects` - Get all projects (requires token)
- `GET /projects/:id` - Get project by ID (requires token)
- `POST /projects` - Create project (requires token)
- `PUT /projects/:id` - Update project (requires token)
- `DELETE /projects/:id` - Delete project (requires token)

### Time Entries
- `GET /time-entries` - Get all time entries (requires token)
- `GET /my-time-entries` - Get user's time entries (requires token)
- `POST /time-entries` - Create time entry (requires token)
- `PUT /time-entries/:id` - Update time entry (requires token)
- `DELETE /time-entries/:id` - Delete time entry (requires token)

## Database Schema

### users table
```
id (SERIAL PRIMARY KEY)
username (VARCHAR(50) UNIQUE NOT NULL)
email (VARCHAR(100) UNIQUE NOT NULL)
password (VARCHAR(255) NOT NULL) - bcrypt hashed
role (VARCHAR(20) DEFAULT 'employee')
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
last_login (TIMESTAMP)
is_active (BOOLEAN DEFAULT true)
```

### projects table
```
id (SERIAL PRIMARY KEY)
name (VARCHAR(100) NOT NULL)
code (VARCHAR(20) UNIQUE NOT NULL)
description (TEXT)
status (VARCHAR(20) DEFAULT 'active')
created_by (INTEGER REFERENCES users(id))
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
```

### time_entries table
```
id (SERIAL PRIMARY KEY)
user_id (INTEGER REFERENCES users(id) ON DELETE CASCADE)
project_id (INTEGER REFERENCES projects(id) ON DELETE CASCADE)
date (DATE NOT NULL)
hours (DECIMAL(5,2) NOT NULL)
description (TEXT)
status (VARCHAR(20) DEFAULT 'pending')
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
```

## Security Features

✅ Bcrypt password hashing (12 salt rounds)
✅ JWT token authentication (7-day expiry)
✅ Rate limiting on login (5 attempts per 15 minutes)
✅ Rate limiting on registration (10 per hour)
✅ CORS security
✅ Security headers
✅ Input validation & sanitization
✅ SQL injection prevention (parameterized queries)
✅ Password strength requirements
✅ Security event logging
