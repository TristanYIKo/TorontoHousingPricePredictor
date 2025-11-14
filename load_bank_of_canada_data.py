"""
Fetch interest rate and bond yield data from Bank of Canada Valet API
and upsert into Supabase toronto_housing table.

This script adds two columns to the existing toronto_housing table:
- interest_rate (overnight rate)
- bond_yield (10-year Government of Canada bond yield)

The data is merged with existing economic indicators by REF_DATE.
"""

import requests
import pandas as pd
import numpy as np
import os
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Bank of Canada Valet API base URL
VALET_API_BASE = "https://www.bankofcanada.ca/valet/observations"

# Series IDs (verified working)
# Find more at: https://www.bankofcanada.ca/rates/ or https://www.bankofcanada.ca/valet/docs
OVERNIGHT_RATE_SERIES = "V122530"  # Overnight Money Market Financing Rate (monthly)
BOND_YIELD_SERIES = "V122538"      # Government of Canada 5-year bond yield (monthly)


def fetch_valet_series(series_id: str, start: str = "1900-01-01") -> pd.DataFrame:
    """
    Fetch historical data from the Bank of Canada Valet API.
    
    Args:
        series_id: The Valet series identifier
        start: Start date in YYYY-MM-DD format
    
    Returns:
        DataFrame with columns: ref_date (YYYY-MM), value (float)
    """
    end_date = datetime.now().strftime("%Y-%m-%d")
    
    url = f"{VALET_API_BASE}/{series_id}/json"
    params = {
        "start_date": start,
        "end_date": end_date
    }
    
    print(f"Fetching series {series_id}...")
    print(f"  URL: {url}")
    print(f"  Date range: {start} to {end_date}")
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    data = response.json()
    
    # Extract observations
    observations = data.get("observations", [])
    
    if not observations:
        print(f"  ⚠ No observations found for series {series_id}")
        return pd.DataFrame(columns=["ref_date", "value"])
    
    # Convert to DataFrame
    df = pd.DataFrame(observations)
    
    # The Valet API returns 'd' for date and the series ID contains {'v': value}
    if "d" not in df.columns or series_id not in df.columns:
        print(f"  ⚠ Unexpected column structure: {df.columns.tolist()}")
        return pd.DataFrame(columns=["ref_date", "value"])
    
    # Extract the 'v' value from the nested dictionary
    df["value"] = df[series_id].apply(lambda x: x.get("v") if isinstance(x, dict) else x)
    df = df.rename(columns={"d": "date"})
    df = df[["date", "value"]].copy()
    
    # Convert date to datetime
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    
    # Convert value to numeric
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    
    # Drop rows with missing dates or values
    initial_count = len(df)
    df = df.dropna(subset=["date", "value"])
    
    print(f"  ✓ Fetched {len(df)} valid observations (dropped {initial_count - len(df)} invalid)")
    
    if df.empty:
        return pd.DataFrame(columns=["ref_date", "value"])
    
    # Convert to monthly frequency (last observation of each month)
    df = df.set_index("date")
    monthly = df.resample("M").last()
    monthly = monthly.reset_index()
    
    # Format ref_date as YYYY-MM
    monthly["ref_date"] = monthly["date"].dt.strftime("%Y-%m")
    monthly = monthly[["ref_date", "value"]].copy()
    
    # Drop rows with missing values
    monthly = monthly.dropna()
    
    print(f"  ✓ Converted to {len(monthly)} monthly observations")
    if not monthly.empty:
        print(f"    First ref_date: {monthly['ref_date'].iloc[0]}")
        print(f"    Last ref_date: {monthly['ref_date'].iloc[-1]}")
    
    return monthly


def upsert_to_supabase(supabase, df, batch_size=500):
    """
    Upsert data to Supabase toronto_housing table in batches.
    
    Args:
        supabase: Supabase client
        df: DataFrame with REF_DATE and value columns
        batch_size: Number of rows to upsert at once
    
    Returns:
        Total number of rows upserted
    """
    if df.empty:
        print("⚠ No data to upsert")
        return 0
    
    print(f"\nUpserting {len(df)} rows to Supabase toronto_housing table...")
    
    # Replace NaN with None for JSON compatibility
    df = df.replace({np.nan: None})
    
    # Convert to list of dicts
    records = df.to_dict(orient="records")
    
    # Upsert in batches
    total_upserted = 0
    num_batches = (len(records) + batch_size - 1) // batch_size
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        batch_num = i // batch_size + 1
        
        print(f"  Upserting batch {batch_num}/{num_batches} ({len(batch)} rows)...")
        
        try:
            result = supabase.table("toronto_housing").upsert(
                batch,
                on_conflict="ref_date"
            ).execute()
            
            total_upserted += len(batch)
            
        except Exception as e:
            print(f"  ✗ Error upserting batch {batch_num}: {e}")
            raise
    
    print(f"✓ Successfully upserted {total_upserted} rows")
    
    return total_upserted


def main():
    """
    Main function to fetch Bank of Canada data and upsert to Supabase.
    """
    print("=" * 70)
    print("Bank of Canada Data Loader - Interest Rate & Bond Yield")
    print("=" * 70 + "\n")
    
    # Get Supabase credentials from environment
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url:
        print("✗ ERROR: SUPABASE_URL environment variable not set")
        return
    
    if not supabase_key:
        print("✗ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set")
        print("\nNote: This script requires the SERVICE ROLE KEY (not the anon key)")
        print("Find it in: Supabase Dashboard → Settings → API → service_role key")
        return
    
    # Create Supabase client
    supabase = create_client(supabase_url, supabase_key)
    print(f"✓ Connected to Supabase: {supabase_url}\n")
    
    try:
        # Fetch overnight rate (interest rate)
        print("-" * 70)
        print("Fetching Overnight Rate (Interest Rate)")
        print("-" * 70)
        df_interest = fetch_valet_series(OVERNIGHT_RATE_SERIES)
        df_interest = df_interest.rename(columns={"value": "interest_rate"})
        
        # Fetch 10-year bond yield
        print("\n" + "-" * 70)
        print("Fetching 10-Year Government of Canada Bond Yield")
        print("-" * 70)
        df_bond = fetch_valet_series(BOND_YIELD_SERIES)
        df_bond = df_bond.rename(columns={"value": "bond_yield"})
        
        # Merge the two series
        print("\n" + "-" * 70)
        print("Merging Series")
        print("-" * 70)
        
        merged = df_interest.merge(df_bond, on="ref_date", how="outer")
        merged = merged.sort_values("ref_date")
        
        print(f"✓ Merged dataset: {len(merged)} rows")
        if not merged.empty:
            print(f"  Date range: {merged['ref_date'].iloc[0]} to {merged['ref_date'].iloc[-1]}")
            print(f"  Columns: {list(merged.columns)}")
            
            # Show summary statistics
            print(f"\n  Interest rate coverage: {merged['interest_rate'].notna().sum()} / {len(merged)} rows")
            print(f"  Bond yield coverage: {merged['bond_yield'].notna().sum()} / {len(merged)} rows")
        
        # Upsert to Supabase
        print("\n" + "=" * 70)
        total_rows = upsert_to_supabase(supabase, merged, batch_size=500)
        
        print("\n" + "=" * 70)
        print(f"✓ SUCCESS! Upserted {total_rows} rows to toronto_housing table")
        print("=" * 70)
        
    except requests.exceptions.HTTPError as e:
        print(f"\n✗ HTTP Error fetching data from Bank of Canada: {e}")
        print("Please check the series IDs and try again.")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    main()
