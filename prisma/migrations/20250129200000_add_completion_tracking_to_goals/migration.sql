-- Migration to add completion tracking fields to user_goals table
-- Created: 2025-01-29

-- Add new columns to user_goals table
ALTER TABLE "user_goals"
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have createdAt and updatedAt timestamps
-- Set createdAt to startDate for existing goals and updatedAt to current time
UPDATE "user_goals"
SET "createdAt" = "startDate",
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "createdAt" IS NULL;
