-- Migration script to add new order statuses to the enum type
-- Run this script in your PostgreSQL database

-- Add new enum values to order_status
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'packed';
