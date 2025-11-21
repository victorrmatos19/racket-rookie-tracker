-- Add monthly_fee column to students table
ALTER TABLE students ADD COLUMN monthly_fee DECIMAL(10,2) DEFAULT 0 NOT NULL;