-- Migration: Add work_location column to time_entries table
-- Purpose: Track whether employee worked from office or work from home
-- Date: 2026-02-05

ALTER TABLE time_entries 
ADD COLUMN work_location VARCHAR(20) DEFAULT 'office' NOT NULL;

-- Add constraint to validate work_location values
ALTER TABLE time_entries
ADD CONSTRAINT check_work_location 
CHECK (work_location IN ('office', 'work_from_home'));

-- Create index for faster filtering
CREATE INDEX idx_time_entries_work_location ON time_entries(work_location);

-- Create index for user + location queries
CREATE INDEX idx_time_entries_user_location ON time_entries(user_id, work_location);
