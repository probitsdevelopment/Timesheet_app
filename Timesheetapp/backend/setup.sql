-- PostgreSQL Database Setup for Timesheet Application
-- Run these commands in PostgreSQL to create the database and tables

-- Create database
CREATE DATABASE timesheet_db;

-- Connect to the database
\c timesheet_db

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'employee',
  organization VARCHAR(100) DEFAULT 'Default Organization',
  number_of_hours INTEGER DEFAULT 0,
  manager_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Create projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  start_date DATE,
  organization VARCHAR(100),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(code, organization)
);

-- Create time entries table
CREATE TABLE time_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  task_start TIME,
  task_end TIME,
  hours DECIMAL(5,2) NOT NULL,
  description TEXT,
  reason VARCHAR(50) DEFAULT 'Development',
  status VARCHAR(20) DEFAULT 'pending',
  organization VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);

-- Verify tables were created
\dt
