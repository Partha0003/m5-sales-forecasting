// Type definitions for the application

export interface ItemMaster {
  id: string;
  item_id: string;
  dept_id: string;
  cat_id: string;
  store_id: string;
  state_id: string;
}

export interface Forecast {
  id: string;
  F1: number;
  F2: number;
  F3: number;
  F4: number;
  F5: number;
  F6: number;
  F7: number;
  F8: number;
  F9: number;
  F10: number;
  F11: number;
  F12: number;
  F13: number;
  F14: number;
  F15: number;
  F16: number;
  F17: number;
  F18: number;
  F19: number;
  F20: number;
  F21: number;
  F22: number;
  F23: number;
  F24: number;
  F25: number;
  F26: number;
  F27: number;
  F28: number;
}

export interface HistoricalSale {
  id: string;
  date: string;
  sales: number;
}

export interface CalendarEntry {
  date: string;
  d: string;
  year?: number;
  month?: number;
}

export interface FilterState {
  state: string;
  store: string;
  category: string;
  department: string;
  item: string;
}

export interface SalesDataPoint {
  date: string;
  sales: number;
}

export interface ForecastDataPoint {
  day: number;
  forecast: number;
  date: string;
  lower_bound?: number;
  upper_bound?: number;
}

