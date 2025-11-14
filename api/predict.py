import json
import os
import joblib
import numpy as np
from supabase import create_client
import pandas as pd
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Load models at module level (cached between invocations)
MODELS = {}
HORIZONS = [1, 2, 3, 6, 12, 24, 36]

def load_models():
    """Load all trained models"""
    if not MODELS:
        base_dir = os.path.dirname(os.path.dirname(__file__))
        for h in HORIZONS:
            model_path = os.path.join(base_dir, f"models/xgboost_h{h}.pkl")
            if os.path.exists(model_path):
                MODELS[h] = joblib.load(model_path)
    return MODELS

def fetch_latest_data():
    """Fetch the most recent data point from Supabase"""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Missing Supabase credentials in environment variables")
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Get latest row
    response = supabase.table("toronto_housing").select("*").order("ref_date", desc=True).limit(1).execute()
    
    if not response.data:
        raise ValueError("No data found in toronto_housing table")
    
    return pd.DataFrame(response.data)

def fetch_historical_data(months=12):
    """Fetch historical data for chart display"""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Get last N months of data
    response = supabase.table("toronto_housing").select("ref_date,housing_price_index_value").order("ref_date", desc=True).limit(months).execute()
    
    if not response.data:
        return []
    
    # Reverse to chronological order
    data = response.data[::-1]
    return [{"date": row["ref_date"], "hpi": row["housing_price_index_value"]} for row in data]

class handler(BaseHTTPRequestHandler):
    """
    Vercel serverless function handler
    
    Query params:
        horizon: prediction horizon (1, 2, 3, 6, 12, 24, 36)
        include_historical: if true, returns historical data too
    
    Returns:
        JSON with prediction and optional historical data
    """
    
    def do_GET(self):
        try:
            # Parse query parameters
            parsed_url = urlparse(self.path)
            params = parse_qs(parsed_url.query)
            
            horizon = int(params.get('horizon', [1])[0])
            include_historical = params.get('include_historical', ['false'])[0].lower() == 'true'
            
            if horizon not in HORIZONS:
                self.send_error_response(400, f'Invalid horizon. Must be one of {HORIZONS}')
                return
            
            # Load models
            models = load_models()
            model = models.get(horizon)
            
            if not model:
                self.send_error_response(404, f'Model for horizon {horizon} not found')
                return
            
            # Fetch latest data
            df = fetch_latest_data()
            
            # Prepare features (exclude non-numeric and special columns)
            exclude_cols = ['ref_date', 'housing_price_index_value']
            feature_cols = [col for col in df.columns if col not in exclude_cols]
            numeric_features = df[feature_cols].select_dtypes(include=[np.number]).columns.tolist()
            
            X = df[numeric_features]
            
            # Make prediction
            prediction = model.predict(X)[0]
            current_hpi = df['housing_price_index_value'].iloc[0]
            
            # Calculate percentage change
            pct_change = ((prediction - current_hpi) / current_hpi) * 100
            
            # Build response
            response_data = {
                'horizon_months': horizon,
                'current_hpi': float(current_hpi),
                'predicted_hpi': float(prediction),
                'percentage_change': float(pct_change),
                'ref_date': str(df['ref_date'].iloc[0])
            }
            
            # Add historical data if requested
            if include_historical:
                response_data['historical'] = fetch_historical_data(12)
            
            self.send_success_response(response_data)
            
        except ValueError as e:
            self.send_error_response(400, str(e))
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def send_success_response(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
