-- Migration: Add all missing columns to salary_processing table
-- These columns are required by the salaryProcessingController

ALTER TABLE salary_processing 
ADD COLUMN IF NOT EXISTS unpaid_leaves INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deduction DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_salary DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS timesheet_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS processed_by INTEGER,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_salary_processing_unpaid_leaves ON salary_processing(unpaid_leaves);
CREATE INDEX IF NOT EXISTS idx_salary_processing_deduction ON salary_processing(deduction);
CREATE INDEX IF NOT EXISTS idx_salary_processing_final_salary ON salary_processing(final_salary);
CREATE INDEX IF NOT EXISTS idx_salary_processing_timesheet_approved ON salary_processing(timesheet_approved);
CREATE INDEX IF NOT EXISTS idx_salary_processing_processed_by ON salary_processing(processed_by);
CREATE INDEX IF NOT EXISTS idx_salary_processing_processed_at ON salary_processing(processed_at);
