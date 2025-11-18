import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const horizon = searchParams.get('horizon') || '1';
  const includeHistorical = searchParams.get('include_historical') === 'true';

  const horizonMonths = parseInt(horizon);
  console.log('Received horizon:', horizonMonths); // Debug log
  let predicted_hpi = 165.0;
  let percentage_change = 0;

  switch (horizonMonths) {
    case 1:
      predicted_hpi = 168.5;
      percentage_change = 2.12;
      break;
    case 2:
      predicted_hpi = 169.2;
      percentage_change = 2.55;
      break;
    case 3:
      predicted_hpi = 170.3;
      percentage_change = 3.21;
      break;
    case 6:
      predicted_hpi = 174.1;
      percentage_change = 5.52;
      break;
    case 12:
      predicted_hpi = 172.0;
      percentage_change = 4.24;
      break;
    case 24:
      predicted_hpi = 176.0;
      percentage_change = 6.67;
      break;
    case 36:
      predicted_hpi = 180.0;
      percentage_change = 9.09;
      break;
    default:
      predicted_hpi = 168.5;
      percentage_change = 2.12;
  }

  return NextResponse.json({
    horizon_months: horizonMonths,
    current_hpi: 165.0,
    predicted_hpi,
    percentage_change,
    ref_date: '2025-11',
    note: 'Using dynamic mock data in development mode'
  }, { status: 200 });
}
