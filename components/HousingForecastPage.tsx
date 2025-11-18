"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

// Type definitions
type HistoricalPoint = { date: string; hpi: number };
type ForecastPoint = { date: string; hpi: number; isFuture: boolean };

type Horizon = {
  id: string;
  label: string;
  months: number;
  points: ForecastPoint[];
};

type PredictionData = {
  horizon_months: number;
  current_hpi: number;
  predicted_hpi: number;
  percentage_change: number;
  ref_date: string;
  historical?: HistoricalPoint[];
};

// Mock data - will be replaced by API calls
const latestHpi = 165.0;

// Extended historical data (more months of history)
let historical: HistoricalPoint[] = [
  { date: "2024-12", hpi: 152.5 },
  { date: "2025-01", hpi: 153.8 },
  { date: "2025-02", hpi: 154.6 },
  { date: "2025-03", hpi: 155.9 },
  { date: "2025-04", hpi: 157.1 },
  { date: "2025-05", hpi: 158.2 },
  { date: "2025-06", hpi: 159.1 },
  { date: "2025-07", hpi: 160.3 },
  { date: "2025-08", hpi: 161.5 },
  { date: "2025-09", hpi: 162.8 },
  { date: "2025-10", hpi: 164.0 },
  { date: "2025-11", hpi: 165.0 }, // Current month
];

const horizons: Horizon[] = [
  {
    id: "1m",
    label: "1 Month",
    months: 1,
    points: [
      { date: "2025-12", hpi: 168.5, isFuture: true },
    ],
  },
  {
    id: "2m",
    label: "2 Months",
    months: 2,
    points: [
      { date: "2025-12", hpi: 168.5, isFuture: true },
      { date: "2026-01", hpi: 169.2, isFuture: true },
    ],
  },
  {
    id: "3m",
    label: "3 Months",
    months: 3,
    points: [
      { date: "2025-12", hpi: 168.5, isFuture: true },
      { date: "2026-01", hpi: 169.2, isFuture: true },
      { date: "2026-02", hpi: 170.3, isFuture: true },
    ],
  },
  {
    id: "6m",
    label: "6 Months",
    months: 6,
    points: [
      { date: "2025-12", hpi: 168.5, isFuture: true },
      { date: "2026-01", hpi: 169.2, isFuture: true },
      { date: "2026-02", hpi: 170.3, isFuture: true },
      { date: "2026-03", hpi: 171.5, isFuture: true },
      { date: "2026-04", hpi: 172.8, isFuture: true },
      { date: "2026-05", hpi: 174.1, isFuture: true },
    ],
  },
  {
    id: "1y",
    label: "1 Year",
    months: 12,
    points: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2025, 11 + i, 1).toISOString().slice(0, 7),
      hpi: 168.5 + i * 0.7,
      isFuture: true,
    })),
  },
  {
    id: "2y",
    label: "2 Years",
    months: 24,
    points: Array.from({ length: 24 }, (_, i) => ({
      date: new Date(2025, 11 + i, 1).toISOString().slice(0, 7),
      hpi: 168.5 + i * 0.6,
      isFuture: true,
    })),
  },
  {
    id: "3y",
    label: "3 Years",
    months: 36,
    points: Array.from({ length: 36 }, (_, i) => ({
      date: new Date(2025, 11 + i, 1).toISOString().slice(0, 7),
      hpi: 168.5 + i * 0.5,
      isFuture: true,
    })),
  },
];

// Custom tooltip component
// Use a custom props type instead of TooltipProps<number, string>
type CustomTooltipProps = {
  active?: boolean;
  payload?: any[];
  label?: string;
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as any;
    const hpiValue = data.historical || data.forecast;
    const isForecast = data.forecast !== null && data.forecast !== undefined;
    
    return (
      <div className="bg-[#0b0b10] border border-yellow-400 rounded-lg p-3 shadow-lg">
        <p className="text-yellow-400 font-semibold text-sm mb-1">{data.date}</p>
        <p className="text-white text-sm">
          HPI: <span className="font-bold">{hpiValue?.toFixed(2)}</span>
        </p>
        <p className={`text-xs mt-1 ${isForecast ? 'text-yellow-300' : 'text-gray-400'}`}>
          {isForecast ? "Forecast" : "Actual"}
        </p>
      </div>
    );
  }
  return null;
};

export default function HousingForecastPage() {
  const [selectedHorizonId, setSelectedHorizonId] = useState("1m");
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedHorizon = useMemo(
    () => horizons.find((h) => h.id === selectedHorizonId),
    [selectedHorizonId]
  );

  // Fetch prediction from API
  useEffect(() => {
    const fetchPrediction = async () => {
      if (!selectedHorizon) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/predict?horizon=${selectedHorizon.months}&include_historical=true`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        
        const data: PredictionData = await response.json();
        setPredictionData(data);
        
        // Update historical data if provided
        if (data.historical && data.historical.length > 0) {
          historical = data.historical;
        }
        
        // Update the selected horizon's forecast points with API prediction
        // For simplicity, we'll use the single prediction point for now
        // In production, you'd fetch all forecast points or generate them
        
      } catch (err) {
        console.error('Error fetching prediction:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch prediction');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrediction();
  }, [selectedHorizon]);

  // Calculate metrics
  const { finalPredictedHpi, percentChange, isPositive, timeLabel, currentHpi } = useMemo(() => {
    if (!selectedHorizon) {
      return {
        finalPredictedHpi: latestHpi,
        percentChange: 0,
        isPositive: true,
        timeLabel: "",
        currentHpi: latestHpi,
      };
    }

    // Use API data if available, otherwise fall back to mock data
    if (predictionData) {
      return {
        finalPredictedHpi: predictionData.predicted_hpi,
        percentChange: predictionData.percentage_change,
        isPositive: predictionData.percentage_change >= 0,
        timeLabel: `in ${selectedHorizon.label.toLowerCase()}`,
        currentHpi: predictionData.current_hpi,
      };
    }

    // Fallback to mock data
    const futurePredictions = selectedHorizon.points.filter((p) => p.isFuture);
    const final = futurePredictions[futurePredictions.length - 1]?.hpi || latestHpi;
    const pctChange = ((final - latestHpi) / latestHpi) * 100;

    let label = "";
    switch (selectedHorizon.id) {
      case "1m":
        label = "in 1 month";
        break;
      case "2m":
        label = "in 2 months";
        break;
      case "3m":
        label = "in 3 months";
        break;
      case "6m":
        label = "in 6 months";
        break;
      case "1y":
        label = "in 1 year";
        break;
      case "2y":
        label = "in 2 years";
        break;
      case "3y":
        label = "in 3 years";
        break;
    }

    return {
      finalPredictedHpi: final,
      percentChange: pctChange,
      isPositive: pctChange >= 0,
      timeLabel: label,
      currentHpi: latestHpi,
    };
  }, [selectedHorizon, predictionData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!selectedHorizon) return { 
      combinedData: [], 
      lastHistoricalDate: "" 
    };

    // Get the last historical point
    const lastHistorical = historical[historical.length - 1];

    // Map all data points for the chart
    const combinedData = [
      // Historical data - grey line (all points except the last one will only have historical)
      ...historical.slice(0, -1).map(p => ({
        date: p.date,
        historical: p.hpi,
        forecast: null
      })),
      // Connection point - last historical point has both values
      {
        date: lastHistorical.date,
        historical: lastHistorical.hpi,
        forecast: lastHistorical.hpi  // Same value for seamless connection
      },
      // Forecast data - yellow line continues from here
      ...selectedHorizon.points.map((p) => ({ 
        date: p.date, 
        historical: null,
        forecast: p.hpi
      }))
    ];

    return {
      combinedData: combinedData,
      lastHistoricalDate: lastHistorical.date,
    };
  }, [selectedHorizon]);

  return (
    <div className="min-h-screen bg-[#050509] text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Hero Card */}
        <Card className="rounded-2xl border border-gray-800 shadow-lg bg-[#0b0b10]">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-3xl font-bold text-white mb-2">
                  Toronto Housing Price Forecast
                </CardTitle>
                <CardDescription className="text-gray-400 text-base leading-relaxed">
                  An XGBoost regression model predicting Toronto&apos;s Housing Price Index
                  at multiple horizons: 1, 2, 3, 6 months and 1, 2, 3 years. Data sourced
                  from Statistics Canada (macroeconomic and housing data) and Bank of Canada
                  Valet API (interest rates, bond yields), stored in Supabase.
                </CardDescription>
              </div>
              <Badge className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 self-start sm:self-center whitespace-nowrap">
                StatsCan + BoC data
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Forecast Overview Card */}
        <Card className="rounded-2xl border border-gray-800 shadow-lg bg-[#0b0b10]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Forecast Overview</CardTitle>
            <CardDescription className="text-gray-400">
              Select a time horizon to view predicted price changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Horizon Tabs */}
            <Tabs value={selectedHorizonId} onValueChange={setSelectedHorizonId}>
              <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 bg-gray-900 p-1">
                {horizons.map((horizon) => (
                  <TabsTrigger
                    key={horizon.id}
                    value={horizon.id}
                    className="data-[state=active]:bg-yellow-400 data-[state=active]:text-gray-900 text-white"
                  >
                    {horizon.id.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Separator className="bg-gray-800" />

            {/* Loading/Error States */}
            {loading && (
              <div className="text-center text-yellow-400 py-4">
                Loading prediction...
              </div>
            )}
            
            {error && (
              <div className="text-center text-red-400 py-4">
                Error: {error}. Using mock data.
              </div>
            )}

            {/* Key Numbers */}
            <div className="space-y-4">
              {/* Percentage Change */}
              <div className="flex items-center gap-3">
                {isPositive ? (
                  <TrendingUp className="h-10 w-10 text-green-400" />
                ) : (
                  <TrendingDown className="h-10 w-10 text-red-400" />
                )}
                <div>
                  <div
                    className={`text-4xl font-bold ${
                      isPositive ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {percentChange.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-400">expected change</div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-400">Current HPI</div>
                  <div className="text-2xl font-bold text-white">
                    {currentHpi.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-400">
                    Predicted HPI <span className="text-yellow-400">{timeLabel}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {finalPredictedHpi.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Projection Chart */}
        <Card className="rounded-2xl border border-gray-800 shadow-lg bg-[#0b0b10]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">
              Price Projection Chart
            </CardTitle>
            <CardDescription className="text-gray-400">
              Visual representation of the Housing Price Index forecast for the selected
              horizon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData.combinedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickMargin={8}
                  domain={["dataMin - 5", "dataMax + 5"]}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference line at today */}
                {chartData.lastHistoricalDate && (
                  <ReferenceLine
                    x={chartData.lastHistoricalDate}
                    stroke="#facc15"
                    strokeDasharray="3 3"
                    label={{
                      value: "Today",
                      fill: "#facc15",
                      fontSize: 12,
                      position: "top",
                    }}
                  />
                )}

                {/* Historical Line (grey) - up to current month */}
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#6b7280"
                  strokeWidth={2}
                  dot={{ fill: "#6b7280", r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Historical"
                  connectNulls={false}
                />

                {/* Forecast Line (yellow) - continues after grey line */}
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#facc15"
                  strokeWidth={3}
                  dot={{ fill: "#facc15", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Forecast"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
