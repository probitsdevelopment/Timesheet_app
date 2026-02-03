-- Migration: Add working_days column to salary_processing table
-- This column tracks the number of working days for salary calculation

ALTER TABLE salary_processing 
ADD COLUMN IF NOT EXISTS working_days INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_salary_processing_working_days ON salary_processing(working_days);
