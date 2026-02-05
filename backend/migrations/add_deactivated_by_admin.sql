-- Add deactivated_by_admin so admin-deactivated farmers cannot log in or self-reactivate.
-- Run with: psql -U postgres -d kissanconnect -f migrations/add_deactivated_by_admin.sql
-- Or in psql: \i migrations/add_deactivated_by_admin.sql

ALTER TABLE users
ADD COLUMN IF NOT EXISTS deactivated_by_admin BOOLEAN DEFAULT false NOT NULL;
