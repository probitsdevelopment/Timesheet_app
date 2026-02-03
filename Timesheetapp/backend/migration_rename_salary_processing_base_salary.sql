-- Migration: Rename base_salary to basic_salary in salary_processing table
-- Align database schema with controller field names

ALTER TABLE salary_processing 
RENAME COLUMN base_salary TO basic_salary;

-- Update indexes if needed
CREATE INDEX IF NOT EXISTS idx_salary_processing_basic_salary ON salary_processing(basic_salary);
