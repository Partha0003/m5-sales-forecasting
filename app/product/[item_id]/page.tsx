'use client';
import ModelPerformanceCard from '@/components/ModelPerformanceCard';
import ForecastSummaryPanel from '@/components/ForecastSummaryPanel';
import VolatilityBadge from '@/components/VolatilityBadge';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import KPICard from '@/components/KPICard';
import RecentPerformanceChart from '@/components/RecentPerformanceChart';
import ForecastChart from '@/components/ForecastChart';
import MonthlySalesChart from '@/components/MonthlySalesChart';
import {
  loadItemMaster,
  getLast90DaysSales,
  getForecastForItem,
  getYearlySalesData
} from '@/lib/dataLoader';
import { generateInsights } from '@/lib/insights';
import { ItemMaster, SalesDataPoint, ForecastDataPoint } from '@/lib/types';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.item_id as string;

  const [itemMaster, setItemMaster] = useState<ItemMaster | null>(null);
  const [recentSales, setRecentSales] = useState<SalesDataPoint[]>([]);
  const [forecast, setForecast] = useState<ForecastDataPoint[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2016);
  const [yearlySales, setYearlySales] = useState<{ month: string; sales: number }[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearlyLoading, setYearlyLoading] = useState(false);

  // Available years (2011-2016)
  const availableYears = [2011, 2012, 2013, 2014, 2015, 2016];

  // Load item master data and find the item
  useEffect(() => {
    const loadItemData = async () => {
      setLoading(true);
      try {
        const items = await loadItemMaster();
        // Find item by item_id (could be in different stores/states)
        const foundItem = items.find(item => item.item_id === itemId);

        if (foundItem) {
          setItemMaster(foundItem);

          // Load sales and forecast data
          const [salesData, forecastData] = await Promise.all([
            getLast90DaysSales(foundItem.id),
            getForecastForItem(foundItem.id),
          ]);

          setRecentSales(salesData);
          setForecast(forecastData);
        }
      } catch (error) {
        console.error('Error loading item data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      loadItemData();
    }
  }, [itemId]);

  // Load yearly data when year is selected
  useEffect(() => {
    const loadYearlyData = async () => {
      if (!itemMaster) return;

      setYearlyLoading(true);
      try {
        const yearlyData = await getYearlySalesData(itemMaster.id, selectedYear);
        setYearlySales(yearlyData);
      } catch (error) {
        console.error('Error loading yearly data:', error);
      } finally {
        setYearlyLoading(false);
      }
    };

    loadYearlyData();
  }, [itemMaster, selectedYear]);

  // Generate insights whenever data changes
  useEffect(() => {
    if (recentSales.length > 0 || forecast.length > 0) {
      const recentAvg = recentSales.length >= 28
        ? recentSales.slice(-28).reduce((sum, s) => sum + s.sales, 0) / 28
        : recentSales.length > 0
          ? recentSales.reduce((sum, s) => sum + s.sales, 0) / recentSales.length
          : 0;
      const forecastAvg = forecast.length > 0
        ? forecast.reduce((sum, f) => sum + f.forecast, 0) / forecast.length
        : 0;
      const absoluteChange = forecastAvg - recentAvg;

      const newInsights = generateInsights(
        recentSales,
        forecast,
        yearlySales.length > 0 ? yearlySales : undefined,
        absoluteChange
      );
      setInsights(newInsights);
    }
  }, [recentSales, forecast, yearlySales]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!itemMaster) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Product not found</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Back to Product Selection
          </button>
        </div>
      </div>
    );
  }

  // Calculate KPIs (All Stores aggregation)
  const totalSales = recentSales.reduce((sum, sale) => sum + sale.sales, 0);
  const avgDailySales = recentSales.length > 0 ? totalSales / recentSales.length : 0;
  const forecastTotal = forecast.reduce((sum, f) => sum + f.forecast, 0);
  const forecastAvgDaily = forecast.length > 0 ? forecastTotal / forecast.length : 0;
  const last28Days = recentSales.slice(-28);
  const recentAvgDaily = last28Days.length > 0
    ? last28Days.reduce((sum, s) => sum + s.sales, 0) / last28Days.length
    : 0;

  // Calculate absolute demand change (units/day)
  const absoluteDemandChange = forecastAvgDaily - recentAvgDaily;

  // Determine trend for arrow display
  const demandChangeTrend = absoluteDemandChange > 0.01 ? 'up'
    : absoluteDemandChange < -0.01 ? 'down'
      : 'neutral';

  // Check if low-volume item for safety note
  const isLowVolume = recentAvgDaily < 1;

  // Calculate volatility for badge
  const calculateVolatility = (): 'stable' | 'moderate' | 'high' => {
    if (recentSales.length === 0) return 'stable';
    const values = recentSales.map(d => d.sales);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) : 0;
    
    if (cv < 0.3) return 'stable';
    if (cv < 0.7) return 'moderate';
    return 'high';
  };

  // Handle forecast download
  const handleDownloadForecast = () => {
    const link = document.createElement('a');
    link.href = '/forecast_with_confidence.csv';
    link.download = 'forecast_with_confidence.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 lg:px-10 py-4">
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium mb-3 inline-flex items-center gap-1"
          >
            ← Back to Product Selection
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Forecast Analysis</h1>
              <p className="text-sm text-gray-600 mt-1">{itemMaster.item_id}</p>
            </div>
            <div className="flex items-center gap-3">
              <VolatilityBadge volatility={calculateVolatility()} />
            </div>
          </div>
        </div>
      </header>

      {/* Full Width Content */}
      <div className="px-6 lg:px-10 py-8 space-y-8">
        {/* Product Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Product Summary</h2>
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-primary-500 rounded-r">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">Scope: All Stores</p>
              <div className="group relative">
                <svg
                  className="w-4 h-4 text-gray-500 cursor-help"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  All metrics, forecasts, and insights are aggregated across all stores and states where this product is sold. Historical sales and forecasts are summed to provide a complete view.
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-600">Item ID</p>
              <p className="text-lg font-semibold text-gray-900">{itemMaster.item_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">State</p>
              <p className="text-lg font-semibold text-gray-900">{itemMaster.state_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Store</p>
              <p className="text-lg font-semibold text-gray-900">{itemMaster.store_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="text-lg font-semibold text-gray-900">{itemMaster.cat_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="text-lg font-semibold text-gray-900">{itemMaster.dept_id}</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="Total Sales (90 Days)"
            value={totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          />
          <KPICard
            title="Average Daily Sales"
            value={avgDailySales.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          />
          <KPICard
            title="Expected Demand Change"
            value={`${absoluteDemandChange >= 0 ? '+' : ''}${absoluteDemandChange.toFixed(2)} units/day`}
            subtitle="Next 28 days vs recent period"
            trend={demandChangeTrend}
          />
        </div>

        {/* Model Performance */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Model Evaluation Summary
          </h2>
          <ModelPerformanceCard />
        </div>

        {/* Historical Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Historical Analysis</h2>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          {yearlyLoading ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-600">Loading yearly data...</p>
            </div>
          ) : yearlySales.length > 0 ? (
            <MonthlySalesChart data={yearlySales} year={selectedYear} title={`Monthly Sales (All Stores) - ${selectedYear}`} />
          ) : (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-600">No data available for selected year</p>
            </div>
          )}
        </div>

        {/* Recent Performance */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Performance (Last 90 Days)</h2>
          <RecentPerformanceChart
            data={recentSales}
            title=""
          />
        </div>

        {/* 28-Day Forecast Analysis */}
        {forecast.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">28-Day Forecast Analysis</h2>
                <div className="group relative inline-block">
                  <span className="text-xs text-gray-400 cursor-help hover:text-gray-600 transition-colors">ℹ️</span>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Forecasts are generated using LightGBM with Tweedie loss, optimized for intermittent retail demand.
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadForecast}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
              >
                Download Forecast (CSV)
              </button>
            </div>
            <ForecastChart
              data={forecast}
              title=""
            />
          </div>
        )}

        {/* Forecast Summary */}
        <ForecastSummaryPanel forecast={forecast} />

        {/* Business Insights - HERO SECTION */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 border-2 border-primary-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Key Business Insights</h2>
              <p className="text-sm text-gray-600 mt-1">Actionable intelligence from forecast analysis</p>
            </div>
          </div>
          
          {isLowVolume && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-r">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> This is a low-volume item; absolute demand changes are more meaningful than percentage growth.
              </p>
            </div>
          )}
          
          {insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="p-5 bg-white rounded-lg border-l-4 border-primary-500 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-primary-600 text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{insight}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600 text-center">Generating insights...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
