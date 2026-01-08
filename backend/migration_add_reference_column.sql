-- Migration: Add is_reference column to form_submissions table
-- Run this SQL script to add the is_reference column to existing databases

-- Check if column exists and add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'form_submissions' 
        AND column_name = 'is_reference'
    ) THEN
        ALTER TABLE form_submissions 
        ADD COLUMN is_reference BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Column is_reference added successfully';
    ELSE
        RAISE NOTICE 'Column is_reference already exists';
    END IF;
END $$;
