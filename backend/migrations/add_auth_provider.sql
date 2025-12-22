-- Migration: Add auth_provider support for OAuth (Google Sign-In)
-- Run this migration to enable Google Login functionality

ALTER TABLE accounts 
ADD COLUMN auth_provider ENUM('local', 'google') DEFAULT 'local' AFTER role,
ADD COLUMN google_uid VARCHAR(128) NULL AFTER auth_provider;

-- Allow NULL password for OAuth users (they authenticate via provider, not password)
ALTER TABLE accounts 
MODIFY COLUMN password VARCHAR(255) NULL;

-- Add index for faster Google UID lookups
ALTER TABLE accounts
ADD INDEX idx_google_uid (google_uid);
