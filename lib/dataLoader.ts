import Papa from 'papaparse';
import { ItemMaster, Forecast, HistoricalSale, CalendarEntry, SalesDataPoint } from './types';

// Cache for loaded data
let itemMasterCache: ItemMaster[] | null = null;
let forecastCache: Forecast[] | null = null;
let calendarCache: CalendarEntry[] | null = null;
let salesCache: Map<string, HistoricalSale[]> = new Map();
let salesWideFormatCache: any[] | null = null; // Cache the entire wide format sales file

/**
 * Load CSV file and parse it
 */
async function loadCSV<T>(filePath: string): Promise<T[]> {
  const response = await fetch(filePath);
  const text = await response.text();
  
  return new Promise((resolve, reject) => {
    Papa.parse<T>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Load item master data (cached)
 */
export async function loadItemMaster(): Promise<ItemMaster[]> {
  if (itemMasterCache) {
    return itemMasterCache;
  }
  
  const data = await loadCSV<ItemMaster>('/item_master.csv');
  itemMasterCache = data;
  return data;
}

/**
 * Load forecast data (cached)
 */
export async function loadForecasts(): Promise<Forecast[]> {
  if (forecastCache) {
    return forecastCache;
  }
  
  const data = await loadCSV<Forecast>('/submission.csv');
  forecastCache = data;
  return data;
}

/**
 * Load calendar data (cached)
 */
export async function loadCalendar(): Promise<CalendarEntry[]> {
  if (calendarCache) {
    return calendarCache;
  }
  
  const data = await loadCSV<{ date: string; d: string; year: string; month: string }>('/calendar.csv');
  // Convert year and month to numbers
  calendarCache = data.map(entry => ({
    date: entry.date,
    d: entry.d,
    year: parseInt(entry.year) || undefined,
    month: parseInt(entry.month) || undefined,
  }));
  return calendarCache;
}

/**
 * Load historical sales data for a specific item
 * This loads from sales_train_evaluation.csv and transforms wide format to long format
 */
export async function loadHistoricalSalesForItem(itemId: string): Promise<HistoricalSale[]> {
  // Check cache first
  if (salesCache.has(itemId)) {
    return salesCache.get(itemId)!;
  }

  // Load sales data (wide format) - use cache if available
  if (!salesWideFormatCache) {
    salesWideFormatCache = await loadCSV<any>('/sales_train_evaluation.csv');
  }
  const salesData = salesWideFormatCache;
  
  // Find the row for this item
  const itemRow = salesData.find((row: any) => row.id === itemId || row.id?.includes(itemId));
  
  if (!itemRow) {
    return [];
  }

  // Load calendar to map d_ columns to dates
  const calendar = await loadCalendar();
  const calendarMap = new Map(calendar.map(entry => [entry.d, entry.date]));

  // Transform wide format to long format
  const historicalSales: HistoricalSale[] = [];
  
  // Get all d_ columns
  Object.keys(itemRow).forEach(key => {
    if (key.startsWith('d_')) {
      const date = calendarMap.get(key);
      if (date) {
        const salesValue = parseFloat(itemRow[key]) || 0;
        historicalSales.push({
          id: itemRow.id || itemId,
          date,
          sales: salesValue,
        });
      }
    }
  });

  // Sort by date
  historicalSales.sort((a, b) => a.date.localeCompare(b.date));
  
  // Cache the result
  salesCache.set(itemId, historicalSales);
  
  return historicalSales;
}

/**
 * Get last 90 days of sales for an item
 */
export async function getLast90DaysSales(itemId: string): Promise<SalesDataPoint[]> {
  const sales = await loadHistoricalSalesForItem(itemId);
  
  // Sort by date descending and take last 90 days
  const sorted = [...sales].sort((a, b) => b.date.localeCompare(a.date));
  const last90 = sorted.slice(0, 90).reverse();
  
  return last90.map(s => ({
    date: s.date,
    sales: s.sales,
  }));
}

/**
 * Get sales data for a specific year (monthly aggregation)
 */
export async function getYearlySalesData(itemId: string, year: number): Promise<{ month: string; sales: number }[]> {
  const sales = await loadHistoricalSalesForItem(itemId);
  
  // Filter by year
  const yearData = sales.filter(s => {
    const saleYear = new Date(s.date).getFullYear();
    return saleYear === year;
  });
  
  // Aggregate by month
  const monthlyMap = new Map<string, number>();
  
  yearData.forEach(sale => {
    const month = new Date(sale.date).toLocaleString('default', { month: 'short' });
    const current = monthlyMap.get(month) || 0;
    monthlyMap.set(month, current + sale.sales);
  });
  
  // Convert to array and sort by month order
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return monthOrder
    .filter(month => monthlyMap.has(month))
    .map(month => ({
      month,
      sales: monthlyMap.get(month) || 0,
    }));
}

/**
 * Get forecast data for an item
 */
export async function getForecastForItem(itemId: string): Promise<{ day: number; forecast: number; date: string }[]> {
  const forecasts = await loadForecasts();
  const calendar = await loadCalendar();
  
  // Find forecast for this item - try exact match first, then partial match
  let itemForecast = forecasts.find(f => f.id === itemId);
  if (!itemForecast) {
    // Try to find by matching the base item_id pattern
    // itemId might be the full id or just the item_id part
    itemForecast = forecasts.find(f => {
      // Extract base pattern from itemId (remove _validation/_evaluation if present)
      const baseId = itemId.replace(/_(validation|evaluation)$/, '');
      const forecastBaseId = f.id.replace(/_(validation|evaluation)$/, '');
      return forecastBaseId === baseId || f.id.includes(itemId) || itemId.includes(f.id);
    });
  }
  
  if (!itemForecast) {
    return [];
  }
  
  // Get the last date from calendar to calculate forecast dates
  const sortedCalendar = [...calendar].sort((a, b) => b.date.localeCompare(a.date));
  const lastDate = sortedCalendar[0]?.date || '2016-05-22';
  const lastDateObj = new Date(lastDate);
  
  // Generate forecast dates (next 28 days)
  const forecastData: { day: number; forecast: number; date: string }[] = [];
  
  for (let i = 1; i <= 28; i++) {
    const forecastDate = new Date(lastDateObj);
    forecastDate.setDate(forecastDate.getDate() + i);
    
    const dayKey = `F${i}` as keyof Forecast;
    const forecastValue = itemForecast[dayKey];
    if (forecastValue !== undefined && forecastValue !== null) {
      forecastData.push({
        day: i,
        forecast: parseFloat(forecastValue as string) || 0,
        date: forecastDate.toISOString().split('T')[0],
      });
    }
  }
  
  return forecastData;
}

/**
 * Get filtered items based on filter criteria
 */
export async function getFilteredItems(filters: {
  state?: string;
  store?: string;
  category?: string;
  department?: string;
  item?: string;
}): Promise<ItemMaster[]> {
  const items = await loadItemMaster();
  
  return items.filter(item => {
    if (filters.state && item.state_id !== filters.state) return false;
    if (filters.store && item.store_id !== filters.store) return false;
    if (filters.category && item.cat_id !== filters.category) return false;
    if (filters.department && item.dept_id !== filters.department) return false;
    if (filters.item && item.item_id !== filters.item) return false;
    return true;
  });
}

