-- Migration: Add UNIQUE constraint to salary_processing table
-- This constraint is required by the ON CONFLICT clause in salaryProcessingController

ALTER TABLE salary_processing 
ADD CONSTRAINT salary_processing_user_id_month_key 
UNIQUE (user_id, month);
