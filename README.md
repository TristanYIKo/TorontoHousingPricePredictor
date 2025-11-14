# Toronto Housing Price Predictor

This project predicts Toronto's Housing Price Index using XGBoost regression at multiple time horizons (1, 2, 3, 6 months and 1, 2, 3 years).

## Setup Instructions

### Environment Variables

This project uses Supabase for data storage. To set up your environment:

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your Supabase credentials** in the `.env` file:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep this secret!)

3. **Never commit the `.env` file** - it's already in `.gitignore` to protect your secrets

### Getting Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to Settings → API
4. Copy the Project URL and the API keys

## Data Sources

- Statistics Canada (macroeconomic and housing data)
- Bank of Canada Valet API (interest rates, bond yields)

## Tech Stack

- **Backend**: Python, XGBoost
- **Frontend**: Next.js 16, React, Tailwind CSS v4
- **Database**: Supabase
- **Visualization**: Recharts
- **UI Components**: shadcn/ui with Radix UI primitives

## Running the Project

### Python Scripts
```bash
# Clean and prepare data
python clean_data.py

# Train models
python train_models.py
```

### Next.js Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the forecast dashboard.

## Security Notice

⚠️ **Important**: Never commit your `.env` file or expose your Supabase service role key publicly. The `.env.example` file is provided as a template only.
