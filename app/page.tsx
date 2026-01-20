'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FilterSidebar from '@/components/FilterSidebar';
import KPICard from '@/components/KPICard';
import RecentPerformanceChart from '@/components/RecentPerformanceChart';
import ForecastChart from '@/components/ForecastChart';
import { FilterState, SalesDataPoint, ForecastDataPoint, ItemMaster } from '@/lib/types';
import { 
  getFilteredItems, 
  getLast90DaysSales, 
  getForecastForItem,
  loadItemMaster 
} from '@/lib/dataLoader';

export default function Dashboard() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({
    state: '',
    store: '',
    category: '',
    department: '',
    item: '',
  });

  const [filteredItems, setFilteredItems] = useState<ItemMaster[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [recentSales, setRecentSales] = useState<SalesDataPoint[]>([]);
  const [forecast, setForecast] = useState<ForecastDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(false);

  // Load filtered items when filters change
  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      try {
        const items = await getFilteredItems({
          state: filters.state || undefined,
          store: filters.store || undefined,
          category: filters.category || undefined,
          department: filters.department || undefined,
          item: filters.item || undefined,
        });
        setFilteredItems(items);

        // If a specific item is selected, use it; otherwise use first item
        if (items.length > 0) {
          const itemToUse = filters.item 
            ? items.find(item => item.item_id === filters.item) || items[0]
            : items[0];
          
          if (itemToUse) {
            // Use the full id from the item
            setSelectedItemId(itemToUse.id);
          }
        }
      } catch (error) {
        console.error('Error loading items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [filters]);

  // Load sales and forecast data when selected item changes
  useEffect(() => {
    const loadItemData = async () => {
      if (!selectedItemId) return;

      setSalesLoading(true);
      try {
        const [salesData, forecastData] = await Promise.all([
          getLast90DaysSales(selectedItemId),
          getForecastForItem(selectedItemId),
        ]);

        setRecentSales(salesData);
        setForecast(forecastData);
      } catch (error) {
        console.error('Error loading item data:', error);
      } finally {
        setSalesLoading(false);
      }
    };

    loadItemData();
  }, [selectedItemId]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (recentSales.length === 0) {
      return {
        totalSales: 0,
        avgDailySales: 0,
        absoluteDemandChange: 0,
        demandChangeTrend: 'neutral' as const,
      };
    }

    const totalSales = recentSales.reduce((sum, sale) => sum + sale.sales, 0);
    const avgDailySales = totalSales / recentSales.length;

    // Calculate absolute demand change: compare next 28 days forecast vs last 28 days actual
    const last28Days = recentSales.slice(-28);
    const recentAvgDaily = last28Days.length > 0
      ? last28Days.reduce((sum, sale) => sum + sale.sales, 0) / last28Days.length
      : 0;
    const forecastAvgDaily = forecast.length > 0 
      ? forecast.reduce((sum, f) => sum + f.forecast, 0) / forecast.length
      : 0;
    
    // Calculate absolute demand change (units/day)
    const absoluteDemandChange = forecastAvgDaily - recentAvgDaily;
    
    // Determine trend for arrow display
    const demandChangeTrend = absoluteDemandChange > 0.01 ? 'up' 
      : absoluteDemandChange < -0.01 ? 'down' 
      : 'neutral';

    return {
      totalSales,
      avgDailySales,
      absoluteDemandChange,
      demandChangeTrend,
    };
  }, [recentSales, forecast]);

  const handleItemClick = (item: ItemMaster) => {
    // Navigate using item_id, which is more user-friendly
    router.push(`/product/${item.item_id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Retail Sales Analytics Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Sales performance and demand forecasting</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <FilterSidebar filters={filters} onFiltersChange={setFilters} />
            
            {/* Items List */}
            {filteredItems.length > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Items ({filteredItems.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredItems.slice(0, 50).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="font-medium text-gray-900">{item.item_id}</div>
                      <div className="text-xs text-gray-500">{item.store_id} • {item.cat_id}</div>
                    </button>
                  ))}
                  {filteredItems.length > 50 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      Showing first 50 of {filteredItems.length} items
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KPICard
                title="Total Historical Sales"
                value={kpis.totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                subtitle="Last 90 days"
              />
              <KPICard
                title="Average Daily Sales"
                value={kpis.avgDailySales.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                subtitle="Last 90 days average"
              />
              <KPICard
                title="Expected Demand Change"
                value={`${kpis.absoluteDemandChange >= 0 ? '+' : ''}${kpis.absoluteDemandChange.toFixed(2)} units/day`}
                subtitle="Next 28 days vs recent period"
                trend={kpis.demandChangeTrend}
              />
            </div>

            {/* Charts */}
            {loading || salesLoading ? (
              <div className="bg-white rounded-lg shadow-md p-12 border border-gray-200 text-center">
                <p className="text-gray-600">Loading data...</p>
              </div>
            ) : recentSales.length > 0 ? (
              <>
                <RecentPerformanceChart data={recentSales} />
                {forecast.length > 0 && <ForecastChart data={forecast} />}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 border border-gray-200 text-center">
                <p className="text-gray-600">Select filters to view sales data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

