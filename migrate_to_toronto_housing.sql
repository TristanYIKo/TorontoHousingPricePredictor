-- Migration: Rename table and add Bank of Canada columns
-- Run this in your Supabase SQL Editor
-- This script is safe to run multiple times (idempotent)

-- Step 1: Rename the table from housing_econ_wide to toronto_housing (if not already done)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'housing_econ_wide') THEN
        ALTER TABLE housing_econ_wide RENAME TO toronto_housing;
        RAISE NOTICE 'Table renamed to toronto_housing';
    ELSE
        RAISE NOTICE 'Table already named toronto_housing or does not exist';
    END IF;
END $$;

-- Step 2: Check current primary key column name and convert if needed
DO $$
BEGIN
    -- If ref_date is DATE type, convert to TEXT (YYYY-MM format)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'toronto_housing' 
        AND column_name = 'ref_date' 
        AND data_type = 'date'
    ) THEN
        -- Add temporary text column
        ALTER TABLE toronto_housing ADD COLUMN ref_date_text TEXT;
        
        -- Copy data, formatting as YYYY-MM
        UPDATE toronto_housing SET ref_date_text = TO_CHAR(ref_date, 'YYYY-MM');
        
        -- Drop old column and primary key
        ALTER TABLE toronto_housing DROP CONSTRAINT IF EXISTS housing_econ_wide_pkey;
        ALTER TABLE toronto_housing DROP CONSTRAINT IF EXISTS toronto_housing_pkey;
        ALTER TABLE toronto_housing DROP COLUMN ref_date;
        
        -- Rename text column
        ALTER TABLE toronto_housing RENAME COLUMN ref_date_text TO ref_date;
        
        -- Set NOT NULL and add primary key
        ALTER TABLE toronto_housing ALTER COLUMN ref_date SET NOT NULL;
        ALTER TABLE toronto_housing ADD PRIMARY KEY (ref_date);
        
        RAISE NOTICE 'Converted ref_date from DATE to TEXT (YYYY-MM)';
    ELSE
        RAISE NOTICE 'ref_date already in correct format or does not exist';
    END IF;
    
    -- If REF_DATE exists but is uppercase, rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'toronto_housing' 
        AND column_name = 'REF_DATE'
    ) THEN
        ALTER TABLE toronto_housing RENAME COLUMN "REF_DATE" TO ref_date;
        RAISE NOTICE 'Renamed REF_DATE to ref_date';
    END IF;
END $$;

-- Step 3: Add the two new columns for Bank of Canada data (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'toronto_housing' 
        AND column_name = 'interest_rate'
    ) THEN
        ALTER TABLE toronto_housing ADD COLUMN interest_rate DOUBLE PRECISION;
        RAISE NOTICE 'Added interest_rate column';
    ELSE
        RAISE NOTICE 'interest_rate column already exists';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'toronto_housing' 
        AND column_name = 'bond_yield'
    ) THEN
        ALTER TABLE toronto_housing ADD COLUMN bond_yield DOUBLE PRECISION;
        RAISE NOTICE 'Added bond_yield column';
    ELSE
        RAISE NOTICE 'bond_yield column already exists';
    END IF;
END $$;

-- Step 4: Add comments to the new columns
COMMENT ON COLUMN toronto_housing.interest_rate IS 'Bank of Canada overnight rate (policy interest rate)';
COMMENT ON COLUMN toronto_housing.bond_yield IS 'Government of Canada 5-year bond yield';

-- Step 5: Update table comment
COMMENT ON TABLE toronto_housing IS 'Toronto housing price predictor - wide table with monthly economic indicators';

-- Step 6: Recreate index on ref_date (drop old one first if exists)
DROP INDEX IF EXISTS idx_housing_econ_wide_date;
DROP INDEX IF EXISTS idx_toronto_housing_date;
CREATE INDEX IF NOT EXISTS idx_toronto_housing_ref_date ON toronto_housing(ref_date);

-- Step 7: Verify the changes
SELECT 
    COUNT(*) as total_rows,
    MIN(ref_date) as earliest_date,
    MAX(ref_date) as latest_date,
    COUNT(interest_rate) as interest_rate_count,
    COUNT(bond_yield) as bond_yield_count
FROM toronto_housing;
