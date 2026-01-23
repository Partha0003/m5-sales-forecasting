'use client';

import React from 'react';
import VolatilityBadge from './VolatilityBadge';
import { ForecastDataPoint } from '@/lib/types';

interface ForecastSummaryPanelProps {
  forecast: ForecastDataPoint[];
}

export default function ForecastSummaryPanel({ forecast }: ForecastSummaryPanelProps) {
  // Calculate summary from forecast data
  const forecastValues = forecast.map(f => f.forecast).filter(v => v !== undefined && !isNaN(v));
  
  const averageDailyForecast = forecastValues.length > 0
    ? forecastValues.reduce((sum, val) => sum + val, 0) / forecastValues.length
    : 0;
  
  const peakDailyDemand = forecastValues.length > 0
    ? Math.max(...forecastValues)
    : 0;

  // Calculate volatility based on peak-to-average ratio
  const calculateVolatility = (): 'stable' | 'moderate' | 'high' => {
    if (forecastValues.length === 0 || averageDailyForecast === 0) return 'stable';
    
    const ratio = peakDailyDemand / averageDailyForecast;
    if (ratio < 2) return 'stable';
    if (ratio < 5) return 'moderate';
    return 'high';
  };

  if (forecast.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Forecast Summary</h2>
        <p className="text-sm text-gray-500">No forecast data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Forecast Summary</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium text-gray-600 mb-2">Average Daily Forecast</h3>
          <p className="text-5xl font-bold text-gray-900">
            {averageDailyForecast.toFixed(2)}
          </p>
          <p className="text-base text-gray-500 mt-1">Mean of all forecasted sales</p>
        </div>

        <div>
          <h3 className="text-base font-medium text-gray-600 mb-2">Peak Daily Demand</h3>
          <p className="text-5xl font-bold text-gray-900">
            {peakDailyDemand.toFixed(2)}
          </p>
          <p className="text-base text-gray-500 mt-1">Maximum forecasted sales value</p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-gray-600 mb-2">Demand Volatility</h3>
              <p className="text-sm text-gray-500">
                Based on peak-to-average ratio
              </p>
            </div>
            <VolatilityBadge volatility={calculateVolatility()} />
          </div>
        </div>

        <div className="pt-2">
          <p className="text-sm text-gray-500">
            Total forecast days: {forecast.length}
          </p>
        </div>
      </div>
    </div>
  );
}
