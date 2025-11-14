import HousingForecastPage from '../components/HousingForecastPage'

// Mock data for demonstration
const mockForecasts = {
  historical: Array.from({ length: 36 }, (_, i) => ({
    date: new Date(2022, i, 1).toISOString().slice(0, 7),
    hpi: 150 + Math.sin(i / 6) * 10 + i * 0.5,
  })),
  horizons: [
    {
      horizonLabel: '1m',
      displayName: 'Next 1 Month',
      points: [{ date: '2025-12', predictedHpi: 168.5 }],
      pctChangeFromLatest: 2.1,
    },
    {
      horizonLabel: '2m',
      displayName: 'Next 2 Months',
      points: [
        { date: '2025-12', predictedHpi: 168.5 },
        { date: '2026-01', predictedHpi: 169.2 },
      ],
      pctChangeFromLatest: 2.5,
    },
    {
      horizonLabel: '3m',
      displayName: 'Next 3 Months',
      points: [
        { date: '2025-12', predictedHpi: 168.5 },
        { date: '2026-01', predictedHpi: 169.2 },
        { date: '2026-02', predictedHpi: 170.1 },
      ],
      pctChangeFromLatest: 3.2,
    },
    {
      horizonLabel: '6m',
      displayName: 'Next 6 Months',
      points: Array.from({ length: 6 }, (_, i) => ({
        date: new Date(2025, 11 + i, 1).toISOString().slice(0, 7),
        predictedHpi: 168.5 + i * 0.8,
      })),
      pctChangeFromLatest: 5.5,
    },
    {
      horizonLabel: '1y',
      displayName: 'Next 1 Year',
      points: Array.from({ length: 12 }, (_, i) => ({
        date: new Date(2025, 11 + i, 1).toISOString().slice(0, 7),
        predictedHpi: 168.5 + i * 0.7,
      })),
      pctChangeFromLatest: 8.2,
    },
    {
      horizonLabel: '2y',
      displayName: 'Next 2 Years',
      points: Array.from({ length: 24 }, (_, i) => ({
        date: new Date(2025, 11 + i, 1).toISOString().slice(0, 7),
        predictedHpi: 168.5 + i * 0.6,
      })),
      pctChangeFromLatest: 12.5,
    },
    {
      horizonLabel: '3y',
      displayName: 'Next 3 Years',
      points: Array.from({ length: 36 }, (_, i) => ({
        date: new Date(2025, 11 + i, 1).toISOString().slice(0, 7),
        predictedHpi: 168.5 + i * 0.5,
      })),
      pctChangeFromLatest: 15.8,
    },
  ],
  latestHpi: 165.0,
}

export default function Home() {
  return <HousingForecastPage forecasts={mockForecasts} />
}
