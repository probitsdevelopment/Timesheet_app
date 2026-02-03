-- Migration: Rename base_salary to basic_salary in salaries table
-- Align database schema with controller field names

ALTER TABLE salaries 
RENAME COLUMN base_salary TO basic_salary;

-- Update indexes if needed
CREATE INDEX IF NOT EXISTS idx_salaries_basic_salary ON salaries(basic_salary);
