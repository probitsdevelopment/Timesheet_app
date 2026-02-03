-- Migration: Add total_leaves column to salary_processing table
-- This column tracks the total number of leaves taken for salary deduction

ALTER TABLE salary_processing 
ADD COLUMN IF NOT EXISTS total_leaves INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_salary_processing_total_leaves ON salary_processing(total_leaves);
