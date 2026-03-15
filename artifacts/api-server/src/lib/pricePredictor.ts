/**
 * Simple moving-average price prediction service.
 * No ML — uses SMA-3, SMA-7 and linear trend extrapolation.
 */

export interface PricePoint {
  price: number;
  date: Date;
}

export interface PredictionResult {
  currentPrice: number;
  nextDayPrice: number;
  nextWeekPrice: number;
  trend: "rising" | "falling" | "stable";
  trendPercent: number;
  dataPoints: number;
  note: string;
}

function sma(prices: number[], window: number): number {
  const slice = prices.slice(-window);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function predictPrice(points: PricePoint[]): PredictionResult {
  if (points.length === 0) {
    return {
      currentPrice: 0,
      nextDayPrice: 0,
      nextWeekPrice: 0,
      trend: "stable",
      trendPercent: 0,
      dataPoints: 0,
      note: "No data available for prediction.",
    };
  }

  // Sort ascending by date
  const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
  const prices = sorted.map((p) => p.price);
  const currentPrice = prices[prices.length - 1];

  if (prices.length === 1) {
    return {
      currentPrice,
      nextDayPrice: currentPrice,
      nextWeekPrice: currentPrice,
      trend: "stable",
      trendPercent: 0,
      dataPoints: 1,
      note: "Only one data point available. Add more entries to improve predictions.",
    };
  }

  // Calculate SMAs
  const sma3 = sma(prices, Math.min(3, prices.length));
  const sma7 = sma(prices, Math.min(7, prices.length));

  // Daily rate of change from linear regression over last min(7, n) points
  const window = prices.slice(-Math.min(7, prices.length));
  const n = window.length;
  let dailyRate = 0;

  if (n >= 2) {
    // Simple linear trend: slope = (last - first) / (n - 1)
    const slope = (window[n - 1] - window[0]) / (n - 1);
    dailyRate = slope / currentPrice; // as fraction
  }

  // Dampen weekly extrapolation (regression to mean)
  const dampFactor = 0.6;
  const nextDayPrice = Math.max(0.01, currentPrice * (1 + dailyRate));
  const nextWeekPrice = Math.max(0.01, currentPrice * (1 + dailyRate * 7 * dampFactor));

  // Trend using SMA comparison + daily rate threshold
  const trendThreshold = 0.005; // 0.5%
  let trend: "rising" | "falling" | "stable";
  if (sma3 > sma7 * (1 + trendThreshold) || dailyRate > trendThreshold) {
    trend = "rising";
  } else if (sma3 < sma7 * (1 - trendThreshold) || dailyRate < -trendThreshold) {
    trend = "falling";
  } else {
    trend = "stable";
  }

  const trendPercent = Math.round(dailyRate * 7 * 100 * 10) / 10; // weekly %

  let note = "";
  if (prices.length < 3) {
    note = "Prediction based on limited data. Add more entries for better accuracy.";
  } else if (trend === "rising") {
    note = `Prices are trending upward. Weekly estimate shows +${Math.abs(trendPercent)}% gain.`;
  } else if (trend === "falling") {
    note = `Prices are trending downward. Weekly estimate shows ${trendPercent}% change.`;
  } else {
    note = "Prices are stable. Market conditions appear steady.";
  }

  return {
    currentPrice: Math.round(currentPrice * 100) / 100,
    nextDayPrice: Math.round(nextDayPrice * 100) / 100,
    nextWeekPrice: Math.round(nextWeekPrice * 100) / 100,
    trend,
    trendPercent,
    dataPoints: prices.length,
    note,
  };
}
