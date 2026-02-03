-- Migration: Rename total_days to allocated_days in leave_allocation table
-- This makes the column name semantically correct (allocated days)

ALTER TABLE leave_allocation 
RENAME COLUMN total_days TO allocated_days;

-- Update indexes if needed
CREATE INDEX IF NOT EXISTS idx_leave_allocation_allocated_days ON leave_allocation(allocated_days);
