-- Migration script: Add Leaves table to existing timesheet_db database
-- Run this if you already have the timesheet_db with users, projects, and time_entries tables

-- Create leaves table
CREATE TABLE IF NOT EXISTS leaves (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number_of_days INTEGER,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  submitted_to INTEGER REFERENCES users(id),
  rejection_reason TEXT,
  organization VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create timesheets table if not exists
CREATE TABLE IF NOT EXISTS timesheets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(7),
  year INTEGER,
  total_hours DECIMAL(6,2),
  status VARCHAR(20) DEFAULT 'draft',
  submitted_to INTEGER REFERENCES users(id),
  submitted_at TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  rejection_reason TEXT,
  organization VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for leaves table
CREATE INDEX IF NOT EXISTS idx_leaves_user_id ON leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_leaves_start_date ON leaves(start_date);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);

-- Create indexes for timesheets table
CREATE INDEX IF NOT EXISTS idx_timesheets_user_id ON timesheets(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_month ON timesheets(month);

-- Verify tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
