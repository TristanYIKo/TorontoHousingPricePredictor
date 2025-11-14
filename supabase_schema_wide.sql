-- SQL Schema for Wide Table - Toronto Housing Price Predictor

-- Create the housing_econ_wide table
-- One row per date with all economic indicators as columns
CREATE TABLE housing_econ_wide (
  ref_date date not null primary key,
  unemployment_value double precision,
  labour_force_value double precision,
  unemployment_rate double precision,
  housing_price_index_value double precision,
  monthly_cpi_value double precision,
  building_permits_value double precision,
  weekly_income_value double precision,
  housing_starts_value double precision,
  housing_under_construction_value double precision,
  housing_completions_value double precision
);

-- Create index for better query performance
CREATE INDEX idx_housing_econ_wide_date ON housing_econ_wide(ref_date);

-- Add comments to the table
COMMENT ON TABLE housing_econ_wide IS 'Wide table with one row per date containing all economic indicators for Toronto housing price prediction';

-- Add comments to columns
COMMENT ON COLUMN housing_econ_wide.ref_date IS 'Reference date (first day of month)';
COMMENT ON COLUMN housing_econ_wide.unemployment_value IS 'Number of unemployed persons';
COMMENT ON COLUMN housing_econ_wide.labour_force_value IS 'Total labour force';
COMMENT ON COLUMN housing_econ_wide.unemployment_rate IS 'Unemployment rate (percentage)';
COMMENT ON COLUMN housing_econ_wide.housing_price_index_value IS 'New housing price index (total house and land)';
COMMENT ON COLUMN housing_econ_wide.monthly_cpi_value IS 'Consumer Price Index (all items, 2002=100)';
COMMENT ON COLUMN housing_econ_wide.building_permits_value IS 'Value of building permits (in dollars)';
COMMENT ON COLUMN housing_econ_wide.weekly_income_value IS 'Average weekly income in Ontario';
COMMENT ON COLUMN housing_econ_wide.housing_starts_value IS 'Number of housing starts';
COMMENT ON COLUMN housing_econ_wide.housing_under_construction_value IS 'Number of housing units under construction';
COMMENT ON COLUMN housing_econ_wide.housing_completions_value IS 'Number of housing completions';
