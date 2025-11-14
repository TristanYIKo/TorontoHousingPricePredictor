import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const horizon = searchParams.get('horizon') || '1';
  const includeHistorical = searchParams.get('include_historical') === 'true';

  try {
    // Since we can't run Python directly in Next.js API routes,
    // we'll need to either:
    // 1. Use a separate Python backend (Flask/FastAPI)
    // 2. Use Vercel serverless functions (which we set up)
    // 3. Pre-compute predictions and serve from JSON
    
    // For now, return mock data with a note
    // When deployed to Vercel, this will be replaced by the Python serverless function
    
    return NextResponse.json({
      error: 'Python API not available in development. Deploy to Vercel to use ML predictions.',
      horizon_months: parseInt(horizon),
      current_hpi: 165.0,
      predicted_hpi: 168.5,
      percentage_change: 2.12,
      ref_date: '2025-11',
      note: 'Using mock data in development mode'
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
