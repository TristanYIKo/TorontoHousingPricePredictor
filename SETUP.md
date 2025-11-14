# Toronto Housing Price Predictor - Setup Instructions

## 1. Install Required Packages

All packages are listed in `requirements.txt` and have been installed:
- pandas
- supabase
- python-dotenv

## 2. Configure Your Supabase Credentials

1. Open the `.env` file in this directory
2. Fill in your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key-here
   ```

### Where to find your Supabase credentials:
1. Go to your Supabase project dashboard
2. Click on "Settings" (gear icon) in the left sidebar
3. Click on "API" under Project Settings
4. Copy the following:
   - **URL**: Copy the "Project URL"
   - **KEY**: Copy the "anon public" key

## 3. Set Up Your Supabase Database

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy the ENTIRE contents of `supabase_schema.sql` and paste it into the SQL editor
5. Click "Run" to execute the SQL

This will create:
- The `economic_indicators` table
- Indexes for better performance
- Comments for documentation

## 4. Run the Data Pipeline

### Step 1: Clean the data
```powershell
python clean_data.py
```

This will create transformed CSV files in `Data/Transformed_CSVs/`

### Step 2: Load data to Supabase
```powershell
python load_to_supabase.py
```

This will upload all the cleaned data to your Supabase table.

## Troubleshooting

- **ModuleNotFoundError**: Run `pip install -r requirements.txt`
- **Supabase connection error**: Check your URL and KEY in `.env` file
- **Table doesn't exist**: Make sure you ran the SQL from `supabase_schema.sql`
