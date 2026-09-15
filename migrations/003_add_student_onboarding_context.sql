-- ============================================================================
-- Migration: 003_add_student_onboarding_context.sql
-- Description: Add nullable career_goal, evaluation_scheme, target_sgpa, 
--              programming_level, and technical_interests columns to student_profiles.
-- Safety Invariant: Non-destructive, all columns are nullable, existing records preserved.
-- ============================================================================

ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS career_goal VARCHAR(50);

ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS evaluation_scheme VARCHAR(50);

ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS target_sgpa DECIMAL(4, 2);

ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS programming_level VARCHAR(50);

ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS technical_interests TEXT[];
