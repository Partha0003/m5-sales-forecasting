import { SalesDataPoint, ForecastDataPoint } from './types';

/**
 * Generate business insights based on sales and forecast data
 * Uses simple logic - no AI text generation
 */
export function generateInsights(
  recentSales: SalesDataPoint[],
  forecast: ForecastDataPoint[],
  yearlyData?: { month: string; sales: number }[]
): string[] {
  const insights: string[] = [];

  if (recentSales.length === 0 && forecast.length === 0) {
    return ['No data available for insights'];
  }

  // Calculate forecast growth
  if (recentSales.length >= 28 && forecast.length > 0) {
    const last28Days = recentSales.slice(-28);
    const last28Avg = last28Days.reduce((sum, s) => sum + s.sales, 0) / last28Days.length;
    const forecastAvg = forecast.reduce((sum, f) => sum + f.forecast, 0) / forecast.length;

    if (last28Avg > 0) {
      const growthPercent = ((forecastAvg - last28Avg) / last28Avg) * 100;
      if (growthPercent > 5) {
        insights.push(`Sales are projected to increase by ${growthPercent.toFixed(1)}% over the next 28 days, indicating strong growth potential.`);
      } else if (growthPercent < -5) {
        insights.push(`Sales are projected to decrease by ${Math.abs(growthPercent).toFixed(1)}% over the next 28 days, suggesting lower demand ahead.`);
      } else {
        insights.push(`Sales are projected to remain relatively stable over the next 28 days with a ${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}% change.`);
      }
    }
  }

  // Analyze recent trend
  if (recentSales.length >= 30) {
    const firstHalf = recentSales.slice(0, Math.floor(recentSales.length / 2));
    const secondHalf = recentSales.slice(Math.floor(recentSales.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.sales, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.sales, 0) / secondHalf.length;

    if (firstAvg > 0) {
      const trendPercent = ((secondAvg - firstAvg) / firstAvg) * 100;
      if (trendPercent > 10) {
        insights.push('Recent trend shows increasing demand, indicating positive momentum.');
      } else if (trendPercent < -10) {
        insights.push('Recent trend shows decreasing demand, indicating a downward trajectory.');
      } else {
        insights.push('Recent trend shows stable demand with consistent performance.');
      }
    }

    // Check for volatility
    const values = recentSales.map(s => s.sales);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;

    if (coefficientOfVariation > 50) {
      insights.push('Sales show high volatility, indicating unpredictable demand patterns.');
    } else if (coefficientOfVariation < 20) {
      insights.push('Sales show low volatility, indicating stable and predictable demand.');
    }
  }

  // Analyze seasonality if yearly data is provided
  if (yearlyData && yearlyData.length >= 6) {
    // Find peak and low months
    const salesByMonth = yearlyData.map(d => d.sales);
    const maxSales = Math.max(...salesByMonth);
    const minSales = Math.min(...salesByMonth);
    const maxMonth = yearlyData.find(d => d.sales === maxSales)?.month;
    const minMonth = yearlyData.find(d => d.sales === minSales)?.month;

    if (maxMonth && minMonth && maxSales > minSales * 1.5) {
      insights.push(`Demand peaks during ${maxMonth}, indicating strong seasonal behavior.`);
    }

    // Check for Q4 peak (holiday season)
    const q4Months = ['Oct', 'Nov', 'Dec'];
    const q4Sales = yearlyData
      .filter(d => q4Months.includes(d.month))
      .reduce((sum, d) => sum + d.sales, 0);
    const yearTotal = yearlyData.reduce((sum, d) => sum + d.sales, 0);
    
    if (yearTotal > 0 && (q4Sales / yearTotal) > 0.3) {
      insights.push('Demand peaks during Q4 (October-December), indicating strong seasonal behavior related to holiday shopping.');
    }
  }

  // If no insights generated, provide a default one
  if (insights.length === 0) {
    insights.push('Analyzing sales patterns and trends...');
  }

  return insights;
}

