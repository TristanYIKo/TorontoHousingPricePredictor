"""Debug script to see what the Bank of Canada API returns."""
import requests
import json

series_id = "V122530"
url = f"https://www.bankofcanada.ca/valet/observations/{series_id}/json"
params = {"start_date": "2024-01-01", "end_date": "2024-12-31"}

response = requests.get(url, params=params)
data = response.json()

print("Response structure:")
print(json.dumps(data, indent=2)[:2000])  # First 2000 chars
