"""
Helper script to find Bank of Canada Valet API series IDs.
This will test various series IDs to find valid ones.
"""

import requests

def test_series(series_id):
    """Test if a series ID is valid."""
    url = f"https://www.bankofcanada.ca/valet/observations/{series_id}/json"
    params = {"start_date": "2020-01-01", "end_date": "2020-12-31"}
    
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            obs = data.get("observations", [])
            if obs and len(obs) > 0:
                # Get the series label from the response
                series_detail = data.get("seriesDetail", {})
                label = series_detail.get(series_id, {}).get("label", "Unknown")
                return True, label, len(obs)
        return False, None, 0
    except:
        return False, None, 0

# Common series IDs to test
test_ids = [
    # Policy rates
    ("V39079", "Bank Rate"),
    ("V39062", "Overnight Rate Target"),
    ("V122530", "Overnight Money Market Financing Rate"),
    
    # Bond yields
    ("V122487", "1-year Treasury Bill"),
    ("V122531", "2-year GoC Bond"),
    ("V122538", "5-year GoC Bond"),
    ("V122543", "10-year GoC Bond"),
    ("V122544", "10-year GoC Bond (average)"),
    ("V122545", "Long-term GoC Bond"),
]

print("Testing Bank of Canada Valet API Series IDs")
print("=" * 70)
print()

for series_id, description in test_ids:
    valid, label, count = test_series(series_id)
    if valid:
        print(f"✓ {series_id}: {label}")
        print(f"  ({count} observations in 2020)")
    else:
        print(f"✗ {series_id}: Not found or no data")
    print()
