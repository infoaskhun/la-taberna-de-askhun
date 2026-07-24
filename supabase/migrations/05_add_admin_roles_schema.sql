-- Migration to add dynamic administration fields and hierarchies to profiles

-- Add columns is_admin and is_owner to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT FALSE;

-- Ensure constraints (optional, e.g., if a profile is an owner, they must be admin too)
-- For simplicity, let's keep them as independent boolean columns.
