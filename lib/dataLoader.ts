import Papa from 'papaparse';
import { ItemMaster, Forecast, CalendarEntry, SalesDataPoint } from './types';

/* =======================
   CACHE
======================= */
let itemMasterCache: ItemMaster[] | null = null;
let forecastCache: Forecast[] | null = null;
let calendarCache: CalendarEntry[] | null = null;

let historical90DaysCache:
  | Array<{ id: string; date: string; sales: number }>
  | null = null;

let historicalMonthlyCache:
  | Array<{ id: string; year: number; month: number; sales: number }>
  | null = null;

/* =======================
   CSV LOADER
======================= */
async function loadCSV<T>(path: string): Promise<T[]> {
  const res = await fetch(path, { cache: 'no-store' });
  const text = await res.text();

  return new Promise((resolve, reject) => {
    Papa.parse<T>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (r) => resolve(r.data),
      error: reject,
    });
  });
}

/* =======================
   MASTER DATA
======================= */
export async function loadItemMaster(): Promise<ItemMaster[]> {
  if (itemMasterCache) return itemMasterCache;
  itemMasterCache = await loadCSV<ItemMaster>('/item_master.csv');
  return itemMasterCache;
}

export async function loadForecasts(): Promise<Forecast[]> {
  if (forecastCache) return forecastCache;
  forecastCache = await loadCSV<Forecast>('/submission.csv');
  return forecastCache;
}

export async function loadCalendar(): Promise<CalendarEntry[]> {
  if (calendarCache) return calendarCache;

  const raw = await loadCSV<any>('/calendar.csv');
  calendarCache = raw.map((r) => ({
    date: r.date,
    d: r.d,
    year: Number(r.year),
    month: Number(r.month),
  }));

  return calendarCache;
}

/* =======================
   PRE-AGGREGATED DATA
======================= */
export async function loadHistorical90Days() {
  if (historical90DaysCache) return historical90DaysCache;

  historical90DaysCache = await loadCSV<{
    id: string;
    date: string;
    sales: number;
  }>('/historical_90_days.csv');

  return historical90DaysCache;
}

export async function loadHistoricalMonthly() {
  if (historicalMonthlyCache) return historicalMonthlyCache;

  historicalMonthlyCache = await loadCSV<{
    id: string;
    year: number;
    month: number;
    sales: number;
  }>('/historical_monthly.csv');

  return historicalMonthlyCache;
}

/* =======================
   HELPERS
======================= */
function getBaseItemId(fullId: string): string {
  // FOODS_1_019_CA_1_evaluation → FOODS_1_019
  return fullId.trim().split('_').slice(0, 3).join('_');
}

/* =======================
   UI DATA FUNCTIONS
======================= */
export async function getLast90DaysSales(itemId: string): Promise<SalesDataPoint[]> {
  const data = await loadHistorical90Days();
  // BUG FIX: Extract base item ID from input (handles both full ID and base ID)
  // Input could be "FOODS_1_019_CA_1_evaluation" or "FOODS_1_019"
  // We need to compare base IDs, so extract base from input first
  const base = getBaseItemId(itemId.trim());

  const dateMap = new Map<string, number>();

  data.forEach((row) => {
    if (getBaseItemId(row.id) === base) {
      // Ensure sales is parsed as number (CSV parsing may return string or number)
      const salesValue = typeof row.sales === 'number' ? row.sales : Number(row.sales) || 0;
      dateMap.set(row.date, (dateMap.get(row.date) || 0) + salesValue);
    }
  });

  return Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, sales]) => ({ date, sales }));
}

export async function getYearlySalesData(itemId: string, year: number) {
  const data = await loadHistoricalMonthly();
  // BUG FIX: Extract base item ID from input (handles both full ID and base ID)
  // Input could be "FOODS_1_019_CA_1_evaluation" or "FOODS_1_019"
  // We need to compare base IDs, so extract base from input first
  const base = getBaseItemId(itemId.trim());

  const monthMap = new Map<number, number>();

  data.forEach((row) => {
    // BUG FIX: Ensure numeric comparison for year (CSV may have floats like 2011.0)
    const rowYear = typeof row.year === 'number' ? Math.floor(row.year) : Number(row.year);
    const rowMonth = typeof row.month === 'number' ? Math.floor(row.month) : Number(row.month);
    
    if (rowYear === year && getBaseItemId(row.id) === base) {
      monthMap.set(rowMonth, (monthMap.get(rowMonth) || 0) + Number(row.sales));
    }
  });

  return Array.from(monthMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([month, sales]) => ({
      month: new Date(2000, month - 1).toLocaleString('default', { month: 'short' }),
      sales,
    }));
}

/* =======================
   FORECAST (UNCHANGED)
======================= */
export async function getForecastForItem(itemId: string) {
  const forecasts = await loadForecasts();
  const calendar = await loadCalendar();

  const forecast =
    forecasts.find((f) => f.id === itemId) ||
    forecasts.find(
      (f) =>
        getBaseItemId(f.id) === getBaseItemId(itemId)
    );

  if (!forecast) return [];

  const lastDate = calendar.map((c) => c.date).sort().pop()!;
  const baseDate = new Date(lastDate);

  return Array.from({ length: 28 }, (_, i) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i + 1);

    return {
      day: i + 1,
      forecast: Number(forecast[`F${i + 1}` as keyof Forecast]),
      date: date.toISOString().split('T')[0],
    };
  });
}

/* =======================
   FILTERS
======================= */
export async function getFilteredItems(filters: {
  state?: string;
  store?: string;
  category?: string;
  department?: string;
  item?: string;
}) {
  const items = await loadItemMaster();

  return items.filter((i) => {
    if (filters.state && i.state_id !== filters.state) return false;
    if (filters.store && i.store_id !== filters.store) return false;
    if (filters.category && i.cat_id !== filters.category) return false;
    if (filters.department && i.dept_id !== filters.department) return false;
    if (filters.item && i.item_id !== filters.item) return false;
    return true;
  });
}
