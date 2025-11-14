"""
Data cleaning script for Toronto Housing Price Predictor.
Transforms multiple CSV files by filtering and selecting relevant columns.
"""

import pandas as pd
import os

# Define input and output directories
INPUT_DIR = os.path.join('Data', 'Original_CSVs')
OUTPUT_DIR = os.path.join('Data', 'Transformed_CSVs')

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)


def clean_unemployment_data():
    """
    Clean MonthlyUnemploymentTotal.csv
    Calculate unemployment rate from unemployment and labour force values.
    """
    print("Processing MonthlyUnemploymentTotal.csv...")
    
    df = pd.read_csv(os.path.join(INPUT_DIR, 'MonthlyUnemploymentTotal.csv'))
    
    # Apply common filters
    df_filtered = df[
        (df['GEO'] == 'Ontario') &
        (df['Gender'] == 'Total - Gender') &
        (df['Age group'] == '15 years and over') &
        (df['Data type'] == 'Seasonally adjusted') &
        (df['Statistics'] == 'Estimate')
    ].copy()
    
    # Get unemployment data
    unemployment_df = df_filtered[
        df_filtered['Labour force characteristics'] == 'Unemployment'
    ][['REF_DATE', 'GEO', 'VALUE']].copy()
    unemployment_df.rename(columns={'VALUE': 'unemployment_value'}, inplace=True)
    
    # Get labour force data
    labour_force_df = df_filtered[
        df_filtered['Labour force characteristics'] == 'Labour force'
    ][['REF_DATE', 'VALUE']].copy()
    labour_force_df.rename(columns={'VALUE': 'labour_force_value'}, inplace=True)
    
    # Merge and calculate unemployment rate
    result = unemployment_df.merge(labour_force_df, on='REF_DATE', how='inner')
    result['unemployment_rate'] = (result['unemployment_value'] / result['labour_force_value']) * 100
    
    # Reorder columns
    result = result[['REF_DATE', 'GEO', 'unemployment_value', 'labour_force_value', 'unemployment_rate']]
    
    # Drop rows with missing values
    result.dropna(inplace=True)
    
    # Save
    result.to_csv(os.path.join(OUTPUT_DIR, 'transformed_MonthlyUnemploymentTotal.csv'), index=False)
    print(f"  ✓ Saved transformed_MonthlyUnemploymentTotal.csv ({len(result)} rows)")
    
    return result


def clean_housing_price_index():
    """
    Clean MonthlyHousingPriceIndexTotal.csv
    Filter for Toronto total house and land prices.
    """
    print("Processing MonthlyHousingPriceIndexTotal.csv...")
    
    df = pd.read_csv(os.path.join(INPUT_DIR, 'MonthlyHousingPriceIndexTotal.csv'))
    
    # Apply filters
    df_filtered = df[
        (df['GEO'] == 'Toronto, Ontario') &
        (df['New housing price indexes'] == 'Total (house and land)')
    ].copy()
    
    # Select columns
    result = df_filtered[['REF_DATE', 'GEO', 'VALUE']].copy()
    
    # Drop rows with missing values
    result.dropna(inplace=True)
    
    # Save
    result.to_csv(os.path.join(OUTPUT_DIR, 'transformed_MonthlyHousingPriceIndexTotal.csv'), index=False)
    print(f"  ✓ Saved transformed_MonthlyHousingPriceIndexTotal.csv ({len(result)} rows)")
    
    return result


def clean_cpi_data():
    """
    Clean MonthlyCPIDataTotal.csv
    Filter for Toronto All-items CPI.
    """
    print("Processing MonthlyCPIDataTotal.csv...")
    
    df = pd.read_csv(os.path.join(INPUT_DIR, 'MonthlyCPIDataTotal.csv'))
    
    # Apply filters
    df_filtered = df[
        (df['GEO'] == 'Toronto, Ontario') &
        (df['Products and product groups'] == 'All-items') &
        (df['UOM'] == '2002=100')
    ].copy()
    
    # Select columns
    result = df_filtered[['REF_DATE', 'GEO', 'VALUE']].copy()
    
    # Drop rows with missing values
    result.dropna(inplace=True)
    
    # Save
    result.to_csv(os.path.join(OUTPUT_DIR, 'transformed_MonthlyCPIDataTotal.csv'), index=False)
    print(f"  ✓ Saved transformed_MonthlyCPIDataTotal.csv ({len(result)} rows)")
    
    return result


def clean_building_permits():
    """
    Clean MonthlyBuildingPermitsToronto.csv
    Filter for Toronto total residential building permit values.
    """
    print("Processing MonthlyBuildingPermitsToronto.csv...")
    
    df = pd.read_csv(os.path.join(INPUT_DIR, 'MonthlyBuildingPermitsToronto.csv'))
    
    # Apply filters
    df_filtered = df[
        (df['GEO'] == 'Toronto, Ontario') &
        (df['Type of structure'] == 'Total residential') &
        (df['Type of work'] == 'Types of work, total') &
        (df['Variables'] == 'Value of permits') &
        (df['Seasonal adjustment'] == 'Unadjusted, current') &
        (df['SCALAR_FACTOR'] == 'thousands')
    ].copy()
    
    # Select columns
    result = df_filtered[['REF_DATE', 'GEO', 'VALUE']].copy()
    
    # Drop rows with missing values
    result.dropna(inplace=True)
    
    # Save
    result.to_csv(os.path.join(OUTPUT_DIR, 'transformed_MonthlyBuildingPermitsToronto.csv'), index=False)
    print(f"  ✓ Saved transformed_MonthlyBuildingPermitsToronto.csv ({len(result)} rows)")
    
    return result


def clean_weekly_income():
    """
    Clean WeeklyIncomeOntario.csv
    Filter for Ontario weekly income data and expand yearly data to monthly rows.
    """
    print("Processing WeeklyIncomeOntario.csv...")
    
    df = pd.read_csv(os.path.join(INPUT_DIR, 'WeeklyIncomeOntario.csv'))
    
    # Apply filters
    df_filtered = df[df['GEO'] == 'Ontario'].copy()
    
    # Select columns
    df_filtered = df_filtered[['REF_DATE', 'GEO', 'VALUE']].copy()
    
    # Drop rows with missing values
    df_filtered.dropna(inplace=True)
    
    # Expand yearly data to monthly rows
    monthly_rows = []
    for _, row in df_filtered.iterrows():
        year = row['REF_DATE']
        value = row['VALUE']
        # Create 12 monthly rows for each year
        for month in range(1, 13):
            monthly_rows.append({
                'REF_DATE': f'{year}-{month:02d}',
                'GEO': 'Toronto, Ontario',
                'VALUE': value
            })
    
    result = pd.DataFrame(monthly_rows)
    
    # Save
    result.to_csv(os.path.join(OUTPUT_DIR, 'transformed_WeeklyIncomeOntario.csv'), index=False)
    print(f"  ✓ Saved transformed_WeeklyIncomeOntario.csv ({len(result)} rows)")
    
    return result


def clean_housing_scu():
    """
    Clean HousingSCUTotal.csv
    Pivot housing starts, under construction, and completions into wide format.
    """
    print("Processing HousingSCUTotal.csv...")
    
    df = pd.read_csv(os.path.join(INPUT_DIR, 'HousingSCUTotal.csv'))
    
    # Apply filters
    df_filtered = df[
        (df['GEO'] == 'Toronto, Ontario') &
        (df['Type of unit'] == 'Total units') &
        (df['Housing estimates'].isin([
            'Housing starts',
            'Housing under construction',
            'Housing completions'
        ]))
    ].copy()
    
    # Select relevant columns
    df_filtered = df_filtered[['REF_DATE', 'GEO', 'Housing estimates', 'VALUE']].copy()
    
    # Drop rows with missing values
    df_filtered.dropna(inplace=True)
    
    # Pivot to wide format
    result = df_filtered.pivot_table(
        index=['REF_DATE', 'GEO'],
        columns='Housing estimates',
        values='VALUE',
        aggfunc='first'
    ).reset_index()
    
    # Rename columns to snake_case
    result.columns.name = None
    result.rename(columns={
        'Housing starts': 'housing_starts',
        'Housing under construction': 'housing_under_construction',
        'Housing completions': 'housing_completions'
    }, inplace=True)
    
    # Reorder columns
    result = result[['REF_DATE', 'GEO', 'housing_starts', 'housing_under_construction', 'housing_completions']]
    
    # Drop rows with any missing values after pivot
    result.dropna(inplace=True)
    
    # Save
    result.to_csv(os.path.join(OUTPUT_DIR, 'transformed_HousingSCUTotal.csv'), index=False)
    print(f"  ✓ Saved transformed_HousingSCUTotal.csv ({len(result)} rows)")
    
    return result


def main():
    """
    Main function to orchestrate all data cleaning operations.
    """
    print("=" * 60)
    print("Starting data cleaning process...")
    print("=" * 60)
    
    try:
        # Clean each dataset
        clean_unemployment_data()
        clean_housing_price_index()
        clean_cpi_data()
        clean_building_permits()
        clean_weekly_income()
        clean_housing_scu()
        
        print("=" * 60)
        print("All files processed successfully!")
        print("=" * 60)
        
    except FileNotFoundError as e:
        print(f"Error: Could not find input file - {e}")
    except KeyError as e:
        print(f"Error: Expected column not found - {e}")
    except Exception as e:
        print(f"Error during processing: {e}")
        raise


if __name__ == "__main__":
    main()
