-- ============================================================================
-- Migration: 004_add_roadmap_specification_fields.sql
-- Description: Add roadmap curriculum metadata and student specialization branch:
--              1. roadmaps: career_slug (VARCHAR 50 NULLABLE), is_active (BOOLEAN NOT NULL DEFAULT TRUE)
--              2. roadmap_nodes: node_key (VARCHAR 50 NULLABLE), branch_key (VARCHAR 50 NOT NULL DEFAULT 'common'),
--                                target_semester (SMALLINT NULLABLE), difficulty (VARCHAR 20 NULLABLE),
--                                skills (TEXT[] NOT NULL DEFAULT '{}'), prerequisite_keys (TEXT[] NOT NULL DEFAULT '{}'),
--                                evidence_prompt (TEXT NULLABLE)
--              3. student_profiles: specialization_branch (VARCHAR 50 NULLABLE DEFAULT NULL)
-- Safety Invariant: Non-destructive, all new columns nullable or have safe defaults, existing records and counts preserved.
-- ============================================================================

-- 1. Roadmaps
ALTER TABLE roadmaps 
ADD COLUMN IF NOT EXISTS career_slug VARCHAR(50);

ALTER TABLE roadmaps 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Roadmap Nodes
ALTER TABLE roadmap_nodes 
ADD COLUMN IF NOT EXISTS node_key VARCHAR(50);

ALTER TABLE roadmap_nodes 
ADD COLUMN IF NOT EXISTS branch_key VARCHAR(50) NOT NULL DEFAULT 'common';

ALTER TABLE roadmap_nodes 
ADD COLUMN IF NOT EXISTS target_semester SMALLINT;

ALTER TABLE roadmap_nodes 
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20);

ALTER TABLE roadmap_nodes 
ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE roadmap_nodes 
ADD COLUMN IF NOT EXISTS prerequisite_keys TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE roadmap_nodes 
ADD COLUMN IF NOT EXISTS evidence_prompt TEXT;

-- 3. Student Profiles
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS specialization_branch VARCHAR(50) DEFAULT NULL;
