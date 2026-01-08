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

  // Calculate forecast growth (All Stores aggregation)
  if (recentSales.length >= 28 && forecast.length > 0) {
    const last28Days = recentSales.slice(-28);
    const last28Avg = last28Days.reduce((sum, s) => sum + s.sales, 0) / last28Days.length;
    const forecastAvg = forecast.reduce((sum, f) => sum + f.forecast, 0) / forecast.length;

    if (last28Avg > 0) {
      let growthPercent = ((forecastAvg - last28Avg) / last28Avg) * 100;
      
      // Safety guard: Clamp extreme values to prevent misleading insights
      const clampedGrowth = Math.max(-200, Math.min(200, growthPercent));
      
      // Only use clamped value if original was extreme (indicates potential data issue)
      const isExtreme = Math.abs(growthPercent) > 200;
      const displayGrowth = isExtreme ? clampedGrowth : growthPercent;
      
      if (displayGrowth > 5) {
        insights.push(`Sales across all stores are projected to increase by ${displayGrowth.toFixed(1)}% over the next 28 days, indicating positive growth potential.`);
      } else if (displayGrowth < -5) {
        insights.push(`Sales across all stores are projected to decrease by ${Math.abs(displayGrowth).toFixed(1)}% over the next 28 days, suggesting a potential decline in demand.`);
      } else {
        insights.push(`Sales across all stores are projected to remain relatively stable over the next 28 days with a ${displayGrowth >= 0 ? '+' : ''}${displayGrowth.toFixed(1)}% change.`);
      }
      
      // Add note if extreme values were clamped
      if (isExtreme) {
        insights.push(`Note: Growth calculation was adjusted due to significant variance. Please review data quality.`);
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
      // Clamp extreme trend values
      const clampedTrend = Math.max(-200, Math.min(200, trendPercent));
      
      if (clampedTrend > 10) {
        insights.push('Recent trend across all stores shows increasing demand, indicating positive momentum.');
      } else if (clampedTrend < -10) {
        insights.push('Recent trend across all stores shows decreasing demand, indicating a downward trajectory.');
      } else {
        insights.push('Recent trend across all stores shows stable demand with consistent performance.');
      }
    }

    // Check for volatility
    const values = recentSales.map(s => s.sales);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;

    if (coefficientOfVariation > 50) {
      insights.push('Sales across all stores show high volatility, indicating unpredictable demand patterns.');
    } else if (coefficientOfVariation < 20) {
      insights.push('Sales across all stores show low volatility, indicating stable and predictable demand.');
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
      insights.push(`Demand across all stores peaks during ${maxMonth}, indicating strong seasonal behavior.`);
    }

    // Check for Q4 peak (holiday season)
    const q4Months = ['Oct', 'Nov', 'Dec'];
    const q4Sales = yearlyData
      .filter(d => q4Months.includes(d.month))
      .reduce((sum, d) => sum + d.sales, 0);
    const yearTotal = yearlyData.reduce((sum, d) => sum + d.sales, 0);
    
    if (yearTotal > 0 && (q4Sales / yearTotal) > 0.3) {
      insights.push('Demand across all stores peaks during Q4 (October-December), indicating strong seasonal behavior related to holiday shopping.');
    }
  }

  // If no insights generated, provide a default one
  if (insights.length === 0) {
    insights.push('Analyzing sales patterns and trends...');
  }

  return insights;
}

