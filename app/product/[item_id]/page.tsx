'use client';

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
      const newInsights = generateInsights(recentSales, forecast, yearlySales.length > 0 ? yearlySales : undefined);
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
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate KPIs
  const totalSales = recentSales.reduce((sum, sale) => sum + sale.sales, 0);
  const avgDailySales = recentSales.length > 0 ? totalSales / recentSales.length : 0;
  const forecastTotal = forecast.reduce((sum, f) => sum + f.forecast, 0);
  const forecastAvg = forecast.length > 0 ? forecastTotal / forecast.length : 0;
  const last28Days = recentSales.slice(-28);
  const last28Avg = last28Days.length > 0 
    ? last28Days.reduce((sum, s) => sum + s.sales, 0) / last28Days.length 
    : 0;
  const forecastGrowth = last28Avg > 0 
    ? ((forecastAvg - last28Avg) / last28Avg) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Product Detail</h1>
          <p className="text-sm text-gray-600 mt-1">{itemMaster.item_id}</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Product Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Product Summary</h2>
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
            title="Forecasted Growth"
            value={`${forecastGrowth >= 0 ? '+' : ''}${forecastGrowth.toFixed(1)}%`}
            subtitle="Next 28 days vs recent"
            trend={forecastGrowth > 0 ? 'up' : forecastGrowth < 0 ? 'down' : 'neutral'}
          />
        </div>

        {/* Recent Performance */}
        <RecentPerformanceChart 
          data={recentSales} 
          title="Recent Performance (Last 90 Days)"
        />

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
            <MonthlySalesChart data={yearlySales} year={selectedYear} />
          ) : (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-600">No data available for selected year</p>
            </div>
          )}
        </div>

        {/* Forecast Analysis */}
        {forecast.length > 0 && (
          <ForecastChart 
            data={forecast} 
            title="28-Day Forecast Analysis"
          />
        )}

        {/* Business Insights */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Business Insights</h2>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className="p-4 bg-blue-50 border-l-4 border-primary-500 rounded-r"
              >
                <p className="text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

