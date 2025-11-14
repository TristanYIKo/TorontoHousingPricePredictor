"use client";

import React, { useState } from "react";
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ForecastPoint {
  date: string;
  predictedHpi: number;
}

interface HorizonForecast {
  id: string; // "1m", "2m", "3m", "6m", "1y", "2y", "3y"
  label: string; // "1 Month", "2 Months", etc.
  pctChangeFromLatest: number;
  points: ForecastPoint[];
}

interface HistoricalPoint {
  date: string;
  hpi: number;
}

interface ForecastsData {
  historical?: HistoricalPoint[];
  horizons: HorizonForecast[];
  latestHpi: number;
}

interface HousingForecastPageProps {
  forecasts: ForecastsData;
}

export default function HousingForecastPage({
  forecasts,
}: HousingForecastPageProps) {
  const [selectedHorizonId, setSelectedHorizonId] = useState(
    forecasts.horizons[0]?.id || "1m"
  );

  const selectedHorizon = forecasts.horizons.find(
    (h) => h.id === selectedHorizonId
  );

  const lastPredictedHpi = selectedHorizon?.points[selectedHorizon.points.length - 1]?.predictedHpi || forecasts.latestHpi;

  // Prepare chart data for the selected horizon
  const getChartData = () => {
    if (!selectedHorizon) return [];
    
    const chartData: Array<{ date: string; hpi: number }> = [];
    
    // Add last few historical points if available
    if (forecasts.historical && forecasts.historical.length > 0) {
      const recentHistory = forecasts.historical.slice(-6);
      recentHistory.forEach(point => {
        chartData.push({ date: point.date, hpi: point.hpi });
      });
    }
    
    // Add current point
    const firstForecastDate = selectedHorizon.points[0]?.date;
    if (firstForecastDate && chartData.length > 0 && chartData[chartData.length - 1].date !== firstForecastDate) {
      chartData.push({ date: firstForecastDate, hpi: forecasts.latestHpi });
    } else if (chartData.length === 0) {
      chartData.push({ date: firstForecastDate || new Date().toISOString().slice(0, 7), hpi: forecasts.latestHpi });
    }
    
    // Add forecast points
    selectedHorizon.points.forEach(point => {
      chartData.push({ date: point.date, hpi: point.predictedHpi });
    });
    
    return chartData;
  };

  const isPositive = selectedHorizon ? selectedHorizon.pctChangeFromLatest >= 0 : true;

  return (
    <div className="min-h-screen bg-[#050509] text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Hero Card */}
        <Card className="bg-gray-900 border-gray-800 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-4xl font-bold text-white">
                Toronto Housing Price Forecast
              </CardTitle>
              <Badge variant="yellow" className="text-xs">
                XGBoost ML
              </Badge>
            </div>
            <CardDescription className="text-gray-400 text-base leading-relaxed">
              This XGBoost regression model predicts Toronto&apos;s Housing Price Index at multiple horizons 
              (1, 2, 3, 6 months and 1, 2, 3 years). Data sourced from Statistics Canada (macroeconomic + housing data) 
              and Bank of Canada Valet API (interest rates, bond yields), stored in Supabase.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Horizon Selection Card */}
        <Card className="bg-gray-900 border-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-yellow-400">Select Forecast Horizon</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedHorizonId} onValueChange={setSelectedHorizonId} className="w-full">
              <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 gap-2 bg-gray-800 p-1 rounded-lg">
                {forecasts.horizons.map((horizon) => (
                  <TabsTrigger
                    key={horizon.id}
                    value={horizon.id}
                    className="data-[state=active]:bg-yellow-400 data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-300 transition-all rounded-md"
                  >
                    {horizon.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Percentage Change Display */}
            {selectedHorizon && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`text-5xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp className="inline h-12 w-12 mr-2" /> : <TrendingDown className="inline h-12 w-12 mr-2" />}
                    {isPositive ? '+' : ''}{selectedHorizon.pctChangeFromLatest.toFixed(2)}%
                  </div>
                  <span className="text-yellow-400 text-lg font-medium">expected change</span>
                </div>
                <p className="text-gray-400 text-sm">
                  From current HPI <span className="text-white font-mono">{forecasts.latestHpi.toFixed(2)}</span> to{' '}
                  <span className="text-white font-mono">{lastPredictedHpi.toFixed(2)}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Forecast Graph */}
        <Card className="bg-gray-900 border-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-yellow-400">Projected Price Path</CardTitle>
            <CardDescription className="text-gray-400">
              Housing Price Index over time for {selectedHorizon?.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  labelStyle={{ color: '#FBBF24' }}
                />
                <Line
                  type="monotone"
                  dataKey="hpi"
                  stroke="#FBBF24"
                  strokeWidth={3}
                  dot={{ fill: '#FBBF24', r: 4 }}
                  activeDot={{ r: 6, fill: '#F59E0B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
