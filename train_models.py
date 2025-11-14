# pip install pandas numpy scikit-learn xgboost python-dotenv supabase-py joblib

"""
Train XGBoost models for Toronto housing price prediction at multiple horizons.

This script:
1. Fetches data from Supabase toronto_housing table
2. Trains separate models for different prediction horizons (1, 2, 3, 6, 12, 24, 36 months)
3. Evaluates model performance with MAE, RMSE, and R²
4. Saves trained models to ./models/
5. Saves predictions to ./outputs/
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime
import joblib
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Prediction horizons in months
HORIZONS = [1, 2, 3, 6, 12, 24, 36]

# TODO: Adjust this to match the actual HPI column name in your toronto_housing table
# Common alternatives: housing_price_index_value, hpi_total, HPI
TARGET_COLUMN = "housing_price_index_value"


def fetch_data_from_supabase():
    """
    Fetch the entire toronto_housing table from Supabase.
    
    Returns:
        DataFrame with ref_date parsed as datetime and sorted ascending
    """
    print("=" * 70)
    print("Fetching data from Supabase...")
    print("=" * 70)
    
    # Get Supabase credentials
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
    
    # Create client
    supabase = create_client(supabase_url, supabase_key)
    print(f"✓ Connected to Supabase: {supabase_url}")
    
    # Fetch all data
    response = supabase.table("toronto_housing").select("*").execute()
    
    # Convert to DataFrame
    df = pd.DataFrame(response.data)
    
    print(f"✓ Fetched {len(df)} rows from toronto_housing table")
    print(f"  Columns: {list(df.columns)}")
    
    # Parse ref_date as datetime
    df['ref_date'] = pd.to_datetime(df['ref_date'] + '-01', errors='coerce')
    
    # Sort by date
    df = df.sort_values('ref_date').reset_index(drop=True)
    
    print(f"  Date range: {df['ref_date'].min().strftime('%Y-%m')} to {df['ref_date'].max().strftime('%Y-%m')}")
    print(f"  Total months: {len(df)}")
    
    return df


def build_supervised_dataset(df, target_col, horizon):
    """
    Build supervised learning dataset for a given prediction horizon.
    
    Args:
        df: DataFrame with features and target
        target_col: Name of the target column (e.g., 'housing_price_index_value')
        horizon: Number of months ahead to predict
    
    Returns:
        X (features), y (target), dates (aligned ref_date index)
    """
    # Create target column shifted by horizon
    target_name = f"target_h{horizon}"
    df_work = df.copy()
    df_work[target_name] = df_work[target_col].shift(-horizon)
    
    # Drop rows with NaN in target
    df_work = df_work.dropna(subset=[target_name])
    
    # Get feature columns (all numeric except ref_date and target columns)
    exclude_cols = ['ref_date'] + [col for col in df_work.columns if col.startswith('target_')]
    feature_cols = [col for col in df_work.columns if col not in exclude_cols]
    
    # Keep only numeric features
    numeric_features = df_work[feature_cols].select_dtypes(include=[np.number]).columns.tolist()
    
    # Extract features, target, and dates
    X = df_work[numeric_features].copy()
    y = df_work[target_name].copy()
    dates = df_work['ref_date'].copy()
    
    return X, y, dates


def train_and_evaluate_model(X_train, y_train, X_test, y_test, horizon):
    """
    Train XGBoost model and evaluate on test set.
    
    Args:
        X_train, y_train: Training data
        X_test, y_test: Test data
        horizon: Prediction horizon in months
    
    Returns:
        Trained model, predictions, and metrics dictionary
    """
    print(f"\n{'=' * 70}")
    print(f"Training model for {horizon}-month horizon")
    print(f"{'=' * 70}")
    print(f"  Training samples: {len(X_train)}")
    print(f"  Test samples: {len(X_test)}")
    print(f"  Features: {X_train.shape[1]}")
    
    # Define model
    model = XGBRegressor(
        n_estimators=500,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        objective='reg:squarederror',
        verbosity=0
    )
    
    # Train model
    print("  Training...")
    model.fit(X_train, y_train)
    
    # Predict on test set
    print("  Predicting...")
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    metrics = {
        'horizon': horizon,
        'mae': mae,
        'rmse': rmse,
        'r2': r2
    }
    
    # Print metrics
    print(f"\n  Model Performance:")
    print(f"    MAE:  {mae:.4f}")
    print(f"    RMSE: {rmse:.4f}")
    print(f"    R²:   {r2:.4f}")
    
    return model, y_pred, metrics


def main():
    """
    Main function to train models for all horizons and save outputs.
    """
    print("\n" + "=" * 70)
    print("TORONTO HOUSING PRICE PREDICTOR - MODEL TRAINING")
    print("=" * 70 + "\n")
    
    # Create output directories
    os.makedirs("./models", exist_ok=True)
    os.makedirs("./outputs", exist_ok=True)
    print("✓ Created output directories: ./models, ./outputs\n")
    
    # Fetch data from Supabase
    df = fetch_data_from_supabase()
    
    # Check if target column exists
    if TARGET_COLUMN not in df.columns:
        print(f"\n✗ ERROR: Target column '{TARGET_COLUMN}' not found in data")
        print(f"  Available columns: {list(df.columns)}")
        print(f"  Please update TARGET_COLUMN in the script")
        return
    
    print(f"\n✓ Using target column: {TARGET_COLUMN}")
    print(f"  Target statistics:")
    print(f"    Min:  {df[TARGET_COLUMN].min():.2f}")
    print(f"    Max:  {df[TARGET_COLUMN].max():.2f}")
    print(f"    Mean: {df[TARGET_COLUMN].mean():.2f}")
    print(f"    Std:  {df[TARGET_COLUMN].std():.2f}")
    
    # Store all metrics and predictions
    all_metrics = []
    all_predictions = []
    
    # Train model for each horizon
    for horizon in HORIZONS:
        # Build supervised dataset
        X, y, dates = build_supervised_dataset(df, TARGET_COLUMN, horizon)
        
        if len(X) == 0:
            print(f"\n⚠ Warning: No data available for {horizon}-month horizon")
            continue
        
        # Time-based train/test split (80/20)
        split_idx = int(len(X) * 0.8)
        
        X_train = X.iloc[:split_idx]
        y_train = y.iloc[:split_idx]
        X_test = X.iloc[split_idx:]
        y_test = y.iloc[split_idx:]
        dates_test = dates.iloc[split_idx:]
        
        # Train and evaluate
        model, y_pred, metrics = train_and_evaluate_model(
            X_train, y_train, X_test, y_test, horizon
        )
        
        # Save model
        model_path = f"./models/xgboost_h{horizon}.pkl"
        joblib.dump(model, model_path)
        print(f"  ✓ Saved model to {model_path}")
        
        # Create predictions DataFrame
        predictions_df = pd.DataFrame({
            'ref_date': dates_test.dt.strftime('%Y-%m'),
            'actual_HPI': y_test.values,
            f'predicted_HPI_h{horizon}': y_pred,
            'horizon_months': horizon
        })
        
        # Save individual predictions
        pred_path = f"./outputs/predictions_h{horizon}.csv"
        predictions_df.to_csv(pred_path, index=False)
        print(f"  ✓ Saved predictions to {pred_path}")
        
        # Store for combined output
        all_metrics.append(metrics)
        all_predictions.append(predictions_df)
    
    # Save all predictions combined
    if all_predictions:
        combined_predictions = pd.concat(all_predictions, ignore_index=True)
        combined_path = "./outputs/all_predictions.csv"
        combined_predictions.to_csv(combined_path, index=False)
        print(f"\n✓ Saved combined predictions to {combined_path}")
    
    # Save metrics summary
    if all_metrics:
        metrics_df = pd.DataFrame(all_metrics)
        metrics_path = "./outputs/model_metrics.csv"
        metrics_df.to_csv(metrics_path, index=False)
        print(f"✓ Saved model metrics to {metrics_path}")
        
        # Print summary table
        print("\n" + "=" * 70)
        print("MODEL PERFORMANCE SUMMARY")
        print("=" * 70)
        print(metrics_df.to_string(index=False))
    
    print("\n" + "=" * 70)
    print("✓ TRAINING COMPLETE!")
    print(f"  Models saved: {len(all_metrics)}")
    print(f"  Prediction files created: {len(all_predictions) + 1}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
