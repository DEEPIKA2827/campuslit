-- ============================================================================
-- Migration: 002_add_clerk_id_to_users.sql
-- Description: Add nullable unique clerk_id column to users table for Phase 6A.2.1 Clerk Foundation
-- Target: PostgreSQL 15+ / Supabase
-- Safety Invariant: Non-destructive, zero child-table foreign key modifications
-- ============================================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(128) UNIQUE;
