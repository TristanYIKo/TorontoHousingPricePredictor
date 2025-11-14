# Toronto Housing Price Predictor - Vercel Deployment Guide

## Setup Instructions

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Set Environment Variables
Before deploying, add these environment variables in Vercel Dashboard:
1. Go to: https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service role key

### 4. Ensure Models are Trained
Run this locally before deploying:
```bash
python train_models.py
```

This generates model files in the `models/` directory that will be deployed.

### 5. Commit Models to Git
```bash
git add models/*.pkl
git commit -m "Add trained models for deployment"
git push
```

### 6. Deploy to Vercel
```bash
# Deploy to production
vercel --prod

# Or deploy preview
vercel
```

## Project Structure for Deployment

```
TorontoHousingPricePredictor/
├── api/
│   ├── predict.py              # Serverless function
│   └── requirements.txt        # Python dependencies
├── app/                        # Next.js app directory
├── components/                 # React components
├── models/                     # Pre-trained ML models (deployed)
├── package.json               # Node.js config
├── vercel.json                # Vercel configuration
└── .vercelignore             # Files to exclude from deployment
```

## API Endpoints

Once deployed, your API will be available at:
- Production: `https://your-app.vercel.app/api/predict?horizon=1`
- Preview: `https://your-app-preview.vercel.app/api/predict?horizon=1`

### API Parameters
- `horizon`: Prediction horizon in months (1, 2, 3, 6, 12, 24, 36)
- `include_historical`: Set to `true` to include historical data in response

### Example Request
```bash
curl "https://your-app.vercel.app/api/predict?horizon=12&include_historical=true"
```

### Example Response
```json
{
  "horizon_months": 12,
  "current_hpi": 165.0,
  "predicted_hpi": 176.4,
  "percentage_change": 6.91,
  "ref_date": "2025-11",
  "historical": [
    {"date": "2024-12", "hpi": 152.5},
    {"date": "2025-01", "hpi": 153.8}
  ]
}
```

## Troubleshooting

### Cold Starts
- First request may take 1-2 seconds as serverless function initializes
- Subsequent requests are faster due to caching

### Model Size Issues
If models are too large (>50MB limit):
- Consider using Vercel Blob Storage
- Or deploy ML models separately (AWS Lambda, Hugging Face)

### Build Failures
Check:
- All Python dependencies are in `api/requirements.txt`
- Environment variables are set in Vercel Dashboard
- Models exist in `models/` directory

## Monitoring

View logs in Vercel Dashboard:
1. Go to your project
2. Click "Deployments"
3. Select a deployment
4. Click "Functions" tab to see API logs

## Updating the Deployment

To update:
```bash
# Make changes
git add .
git commit -m "Your changes"
git push

# Vercel auto-deploys on push if connected to GitHub
# Or manually deploy:
vercel --prod
```
