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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-5xl font-bold text-white">
            Toronto Housing Price Forecast
          </h1>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-gray-300 leading-relaxed">
              Predicting Toronto&apos;s Housing Price Index using an <span className="text-yellow-400 font-semibold">XGBoost regression model</span>.
              The model is trained on data from Statistics Canada (macroeconomic and housing indicators) 
              and the Bank of Canada Valet API (interest rates, bond yields), with all data stored in Supabase.
            </p>
          </div>
        </div>

        {/* Forecast Selection and Table */}
        <Card className="bg-gray-950 border-gray-800 shadow-2xl">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="text-2xl text-yellow-400">Forecast Predictions</CardTitle>
            <CardDescription className="text-gray-400">
              Select a time horizon to view the predicted price change
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Dropdown */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-300 min-w-[140px]">
                Select Time Horizon:
              </label>
              <Select value={selectedHorizonId} onValueChange={setSelectedHorizonId}>
                <SelectTrigger className="w-[280px] bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Select forecast period" />
                </SelectTrigger>
                <SelectContent>
                  {forecasts.horizons.map((horizon) => (
                    <SelectItem key={horizon.id} value={horizon.id}>
                      {horizon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prediction Table */}
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-900 hover:bg-gray-900 border-gray-800">
                    <TableHead className="text-yellow-400 font-semibold">Time Period</TableHead>
                    <TableHead className="text-yellow-400 font-semibold">Current HPI</TableHead>
                    <TableHead className="text-yellow-400 font-semibold">Predicted HPI</TableHead>
                    <TableHead className="text-yellow-400 font-semibold">Change (%)</TableHead>
                    <TableHead className="text-yellow-400 font-semibold text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedHorizon && (
                    <TableRow className="border-gray-800 hover:bg-gray-900/50">
                      <TableCell className="font-medium text-white">{selectedHorizon.label}</TableCell>
                      <TableCell className="text-gray-300">{forecasts.latestHpi.toFixed(2)}</TableCell>
                      <TableCell className="text-gray-300">{lastPredictedHpi.toFixed(2)}</TableCell>
                      <TableCell className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{selectedHorizon.pctChangeFromLatest.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {isPositive ? (
                          <TrendingUp className="inline h-5 w-5 text-green-400" />
                        ) : (
                          <TrendingDown className="inline h-5 w-5 text-red-400" />
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Forecast Graph */}
        <Card className="bg-gray-950 border-gray-800 shadow-2xl">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="text-2xl text-yellow-400">Price Projection Chart</CardTitle>
            <CardDescription className="text-gray-400">
              Visual representation of the Housing Price Index forecast for {selectedHorizon?.label}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={400}>
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
                  label={{ value: 'HPI', angle: -90, position: 'insideLeft', fill: '#FBBF24' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#000000',
                    border: '1px solid #FBBF24',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }}
                  labelStyle={{ color: '#FBBF24', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="hpi"
                  stroke="#FBBF24"
                  strokeWidth={3}
                  dot={{ fill: '#FBBF24', r: 5 }}
                  activeDot={{ r: 7, fill: '#F59E0B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
