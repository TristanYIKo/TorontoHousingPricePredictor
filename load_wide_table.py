"""
Load transformed CSV files into a single wide Supabase table (housing_econ_wide).
One row per ref_date with all economic indicators as columns.

SQL Schema (run this manually in Supabase SQL editor):

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

CREATE INDEX idx_housing_econ_wide_date ON housing_econ_wide(ref_date);
"""

import pandas as pd
import os
import numpy as np
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Define input directory
INPUT_DIR = os.path.join('Data', 'Transformed_CSVs')


def load_unemployment_data():
    """
    Load unemployment data.
    Returns: DataFrame with ref_date, unemployment_value, labour_force_value, unemployment_rate
    """
    print("Loading unemployment data...")
    
    df = pd.read_csv(os.path.join(INPUT_DIR, 'transformed_MonthlyUnemploymentTotal.csv'))
    
    # Parse REF_DATE to datetime and normalize to first of month
    df['ref_date'] = pd.to_datetime(df['REF_DATE'].astype(str) + '-01', errors='coerce')
    
    # Keep only needed columns (drop GEO)
    df = df[['ref_date', 'unemployment_value', 'labour_force_value', 'unemployment_rate']].copy()
    
    # Drop rows with null ref_date
    df = df.dropna(subset=['ref_date'])
    
    print(f"  ✓ Loaded {len(df)} unemployment rows")
    return df


def load_housing_price_index():
    """
    Load Housing Price Index data.
    Returns: DataFrame with ref_date, housing_price_index_value
    """
    print("Loading Housing Price Index data...")
    
    df = pd.read_csv(os.path.join(INPUT_DIR, 'transformed_MonthlyHousingPriceIndexTotal.csv'))
    
    # Parse REF_DATE to datetime and normalize to first of month
    df['ref_date'] = pd.to_datetime(df['REF_DATE'].astype(str) + '-01', errors='coerce')
    
    # Rename VALUE to housing_price_index_value
    df['housing_price_index_value'] = df['VALUE']
    
    # Keep only needed columns (drop GEO)
    df = df[['ref_date', 'housing_price_index_value']].copy()
    
    # Drop rows with null ref_date
    df = df.dropna(subset=['ref_date'])
    
    print(f"  ✓ Loaded {len(df)} HPI rows")
    return df


def load_cpi_data():
    """
    Load CPI data.
    Returns: DataFrame with ref_date, monthly_cpi_value
    """
    print("Loading CPI data...")
    
    df = pd.read_csv(os.path.join(INPUT_DIR, 'transformed_MonthlyCPIDataTotal.csv'))
    
    # Parse REF_DATE to datetime and normalize to first of month
    df['ref_date'] = pd.to_datetime(df['REF_DATE'].astype(str) + '-01', errors='coerce')
    
    # Rename VALUE to monthly_cpi_value
    df['monthly_cpi_value'] = df['VALUE']
    
    # Keep only needed columns (drop GEO)
    df = df[['ref_date', 'monthly_cpi_value']].copy()
    
    # Drop rows with null ref_date
    df = df.dropna(subset=['ref_date'])
    
    print(f"  ✓ Loaded {len(df)} CPI rows")
    return df


def load_building_permits():
    """
    Load Building Permits data.
    Returns: DataFrame with ref_date, building_permits_value
    """
    print("Loading Building Permits data...")
    
    df = pd.read_csv(os.path.join(INPUT_DIR, 'transformed_MonthlyBuildingPermitsToronto.csv'))
    
    # Parse REF_DATE to datetime and normalize to first of month
    df['ref_date'] = pd.to_datetime(df['REF_DATE'].astype(str) + '-01', errors='coerce')
    
    # Rename VALUE to building_permits_value
    df['building_permits_value'] = df['VALUE']
    
    # Keep only needed columns (drop GEO)
    df = df[['ref_date', 'building_permits_value']].copy()
    
    # Drop rows with null ref_date
    df = df.dropna(subset=['ref_date'])
    
    print(f"  ✓ Loaded {len(df)} Building Permits rows")
    return df


def load_weekly_income():
    """
    Load Weekly Income data (yearly data).
    Returns: DataFrame with ref_date, weekly_income_value
    """
    print("Loading Weekly Income data...")
    
    df = pd.read_csv(os.path.join(INPUT_DIR, 'transformed_WeeklyIncomeOntario.csv'))
    
    # Parse REF_DATE - it's in YYYY-MM format, convert to first of month
    df['ref_date'] = pd.to_datetime(df['REF_DATE'].astype(str) + '-01', errors='coerce')
    
    # Rename VALUE to weekly_income_value
    df['weekly_income_value'] = df['VALUE']
    
    # Keep only needed columns (drop GEO)
    df = df[['ref_date', 'weekly_income_value']].copy()
    
    # Drop rows with null ref_date
    df = df.dropna(subset=['ref_date'])
    
    print(f"  ✓ Loaded {len(df)} Weekly Income rows")
    return df


def load_housing_scu():
    """
    Load Housing Starts/Construction/Completions data.
    Returns: DataFrame with ref_date, housing_starts_value, 
             housing_under_construction_value, housing_completions_value
    """
    print("Loading Housing SCU data...")
    
    df = pd.read_csv(os.path.join(INPUT_DIR, 'transformed_HousingSCUTotal.csv'))
    
    # Parse REF_DATE to datetime and normalize to first of month
    df['ref_date'] = pd.to_datetime(df['REF_DATE'].astype(str) + '-01', errors='coerce')
    
    # Rename columns to match schema
    df['housing_starts_value'] = df['housing_starts']
    df['housing_under_construction_value'] = df['housing_under_construction']
    df['housing_completions_value'] = df['housing_completions']
    
    # Keep only needed columns (drop GEO)
    df = df[[
        'ref_date', 
        'housing_starts_value', 
        'housing_under_construction_value', 
        'housing_completions_value'
    ]].copy()
    
    # Drop rows with null ref_date
    df = df.dropna(subset=['ref_date'])
    
    print(f"  ✓ Loaded {len(df)} Housing SCU rows")
    return df


def build_and_load_wide_table(supabase):
    """
    Load all CSV files, merge into wide format, and upsert to Supabase.
    """
    print("\n" + "=" * 60)
    print("Building wide table from transformed CSVs...")
    print("=" * 60 + "\n")
    
    # Load all datasets
    df_unemployment = load_unemployment_data()
    df_hpi = load_housing_price_index()
    df_cpi = load_cpi_data()
    df_permits = load_building_permits()
    df_income = load_weekly_income()
    df_housing = load_housing_scu()
    
    print("\n" + "-" * 60)
    print("Merging all datasets on ref_date...")
    print("-" * 60 + "\n")
    
    # Start with unemployment data and merge all others
    wide_df = df_unemployment
    
    # Merge HPI
    wide_df = wide_df.merge(df_hpi, on='ref_date', how='outer')
    print(f"After merging HPI: {len(wide_df)} rows")
    
    # Merge CPI
    wide_df = wide_df.merge(df_cpi, on='ref_date', how='outer')
    print(f"After merging CPI: {len(wide_df)} rows")
    
    # Merge Building Permits
    wide_df = wide_df.merge(df_permits, on='ref_date', how='outer')
    print(f"After merging Building Permits: {len(wide_df)} rows")
    
    # Merge Weekly Income
    wide_df = wide_df.merge(df_income, on='ref_date', how='outer')
    print(f"After merging Weekly Income: {len(wide_df)} rows")
    
    # Merge Housing SCU
    wide_df = wide_df.merge(df_housing, on='ref_date', how='outer')
    print(f"After merging Housing SCU: {len(wide_df)} rows")
    
    # Sort by ref_date
    wide_df = wide_df.sort_values('ref_date')
    
    # Drop rows with null ref_date
    wide_df = wide_df.dropna(subset=['ref_date'])
    
    # Convert ref_date to string format for Supabase (YYYY-MM-DD)
    wide_df['ref_date'] = wide_df['ref_date'].dt.strftime('%Y-%m-%d')
    
    print(f"\n✓ Final wide table: {len(wide_df)} rows")
    print(f"✓ Columns: {list(wide_df.columns)}")
    
    # Convert to list of dicts, replacing NaN with None for JSON compatibility
    rows = wide_df.replace({np.nan: None}).to_dict(orient='records')
    
    # Upsert to Supabase
    print(f"\nUpserting {len(rows)} rows to Supabase...")
    result = supabase.table('housing_econ_wide').upsert(rows).execute()
    
    print(f"✓ Successfully upserted {len(rows)} rows to housing_econ_wide table")
    
    return len(rows)


def main():
    """
    Main function to load all transformed CSVs into Supabase wide table.
    Requires environment variables: SUPABASE_URL and SUPABASE_KEY
    """
    print("=" * 60)
    print("Loading Wide Table to Supabase...")
    print("=" * 60)
    
    # Get Supabase credentials from environment
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_KEY')
    
    if not supabase_url or not supabase_key:
        print("\n✗ ERROR: SUPABASE_URL and SUPABASE_KEY environment variables must be set")
        print("\nMake sure your .env file contains:")
        print("  SUPABASE_URL=your-url")
        print("  SUPABASE_KEY=your-key")
        return
    
    # Create Supabase client
    supabase = create_client(supabase_url, supabase_key)
    print(f"✓ Connected to Supabase: {supabase_url}\n")
    
    try:
        # Build and load the wide table
        total_rows = build_and_load_wide_table(supabase)
        
        print("\n" + "=" * 60)
        print(f"✓ SUCCESS! Loaded {total_rows} rows to Supabase")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error during loading: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    main()
