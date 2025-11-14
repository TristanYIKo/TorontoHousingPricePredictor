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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface ForecastPoint {
  date: string;
  predictedHpi: number;
}

interface HorizonForecast {
  horizonLabel: string; // "1m", "2m", "3m", "6m", "1y", "2y", "3y"
  displayName: string; // "Next 1 Month", etc.
  points: ForecastPoint[];
  pctChangeFromLatest: number;
}

interface HistoricalPoint {
  date: string;
  hpi: number;
}

interface ForecastsData {
  historical: HistoricalPoint[];
  horizons: HorizonForecast[];
  latestHpi: number;
}

interface HousingForecastPageProps {
  forecasts: ForecastsData;
}

export default function HousingForecastPage({
  forecasts,
}: HousingForecastPageProps) {
  const [selectedHorizon, setSelectedHorizon] = useState(
    forecasts.horizons[0]?.horizonLabel || ""
  );

  const selectedHorizonData = forecasts.horizons.find(
    (h) => h.horizonLabel === selectedHorizon
  );

  // Prepare chart data for the selected horizon
  const getChartData = (horizon: HorizonForecast) => {
    // Combine historical and forecast data
    const historicalData = forecasts.historical.map((point) => ({
      date: point.date,
      historical: point.hpi,
      predicted: null,
    }));

    const forecastData = horizon.points.map((point) => ({
      date: point.date,
      historical: null,
      predicted: point.predictedHpi,
    }));

    // Add a connection point (last historical = first predicted)
    if (historicalData.length > 0 && forecastData.length > 0) {
      forecastData[0] = {
        ...forecastData[0],
        historical: forecasts.latestHpi,
      };
    }

    return [...historicalData.slice(-24), ...forecastData]; // Show last 24 months of history
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            Toronto Housing Price Forecast
          </CardTitle>
          <CardDescription className="text-base mt-2">
            This XGBoost-based predictive model forecasts Toronto&apos;s Housing
            Price Index (HPI) across multiple time horizons: 1, 2, and 3 months,
            as well as 1, 2, and 3 years ahead. The model leverages comprehensive
            macroeconomic indicators including unemployment rates, CPI, building
            permits, bond yields, interest rates, and housing market dynamics. All
            data is sourced from Statistics Canada and the Bank of Canada, stored
            and managed in Supabase for real-time updates and analysis.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Forecast Snapshot Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Forecast Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {forecasts.horizons.map((horizon) => {
            const lastPoint = horizon.points[horizon.points.length - 1];
            const isPositive = horizon.pctChangeFromLatest >= 0;

            return (
              <Card
                key={horizon.horizonLabel}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedHorizon(horizon.horizonLabel)}
              >
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs uppercase tracking-wide">
                    {horizon.displayName}
                  </CardDescription>
                  <CardTitle className="text-2xl">
                    {lastPoint?.predictedHpi.toFixed(2) || "N/A"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {isPositive ? "+" : ""}
                      {horizon.pctChangeFromLatest.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    vs. current HPI
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Forecast Chart with Tabs */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Forecast Chart</h2>
        <Tabs
          value={selectedHorizon}
          onValueChange={setSelectedHorizon}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            {forecasts.horizons.map((horizon) => (
              <TabsTrigger
                key={horizon.horizonLabel}
                value={horizon.horizonLabel}
              >
                {horizon.horizonLabel.replace("m", "M").replace("y", "Y")}
              </TabsTrigger>
            ))}
          </TabsList>

          {forecasts.horizons.map((horizon) => (
            <TabsContent
              key={horizon.horizonLabel}
              value={horizon.horizonLabel}
              className="mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{horizon.displayName} Forecast</CardTitle>
                  <CardDescription>
                    Historical HPI vs. Predicted HPI for {horizon.displayName.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={getChartData(horizon)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="historical"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Historical HPI"
                        dot={false}
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Predicted HPI"
                        dot={{ r: 3 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Separator />

      {/* Forecast Table */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Forecast Details</h2>
        {selectedHorizonData && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedHorizonData.displayName} - Detailed Predictions</CardTitle>
              <CardDescription>
                Month-by-month predictions and percent change from current HPI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Predicted HPI</TableHead>
                    <TableHead className="text-right">Change from Current</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedHorizonData.points.map((point, index) => {
                    const pctChange =
                      ((point.predictedHpi - forecasts.latestHpi) /
                        forecasts.latestHpi) *
                      100;
                    const isPositive = pctChange >= 0;

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {point.date}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {point.predictedHpi.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              isPositive ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {isPositive ? "+" : ""}
                            {pctChange.toFixed(2)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Model Info Footer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Model Information:</strong> Predictions are generated using
              XGBoost regression models trained on historical Toronto housing market
              data and macroeconomic indicators. Past performance does not guarantee
              future results. These forecasts should be used for informational purposes
              only and not as financial advice.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
