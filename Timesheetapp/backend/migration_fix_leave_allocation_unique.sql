-- Migration: Fix UNIQUE constraint in leave_allocation table
-- Remove organization from UNIQUE constraint to match ON CONFLICT clauses

-- Drop the old constraint that includes organization
ALTER TABLE leave_allocation 
DROP CONSTRAINT IF EXISTS leave_allocation_user_id_leave_type_year_organization_key;

-- Create new UNIQUE constraint without organization
ALTER TABLE leave_allocation 
ADD CONSTRAINT leave_allocation_user_id_leave_type_year_key 
UNIQUE (user_id, leave_type, year);
