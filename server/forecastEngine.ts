/**
 * ForecastIQ Forecast Engine
 * Implements moving averages, linear regression, seasonality detection, and confidence bands
 */

interface SalesRecord {
  date: string | Date;
  productName: string;
  category?: string;
  quantitySold: number;
  revenue: number;
}

interface ForecastPoint {
  date: string;
  predictedQty: number;
  predictedRevenue: number;
  lower: number;
  upper: number;
}

interface ProductForecast {
  productName: string;
  currentAvg: number;
  forecastedAvg: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  tag: 'Stock Up' | 'Reduce Order' | 'Monitor';
}

interface ForecastResult {
  overallTrend: 'up' | 'down' | 'stable';
  confidenceScore: number;
  forecastData: ForecastPoint[];
  productForecasts: ProductForecast[];
  insights: string[];
}

// Helper: Parse date safely
function parseDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) return dateStr;
  return new Date(dateStr);
}

// Helper: Format date to YYYY-MM-DD (never throws on invalid dates)
function formatDate(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

// Helper: Add days to date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Step 1: Aggregate sales by day
function aggregateByDay(records: SalesRecord[]): Map<string, { qty: number; revenue: number }> {
  const aggregated = new Map<string, { qty: number; revenue: number }>();
  
  records.forEach(record => {
    const dateStr = formatDate(parseDate(record.date));
    const existing = aggregated.get(dateStr) || { qty: 0, revenue: 0 };
    aggregated.set(dateStr, {
      qty: existing.qty + record.quantitySold,
      revenue: existing.revenue + record.revenue,
    });
  });
  
  return aggregated;
}

// Step 2: Calculate weighted moving average
function calculateWeightedMovingAverage(values: number[], windowSize: number): number[] {
  const result: number[] = [];
  const weights = Array.from({ length: windowSize }, (_, i) => (i + 1) / (windowSize * (windowSize + 1) / 2));
  
  for (let i = 0; i < values.length; i++) {
    if (i < windowSize - 1) {
      result.push(values[i]);
    } else {
      let sum = 0;
      let weightSum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += values[i - windowSize + 1 + j] * weights[j];
        weightSum += weights[j];
      }
      result.push(sum / weightSum);
    }
  }
  
  return result;
}

// Step 3: Linear regression
function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }
  
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  
  // Calculate R²
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    ssRes += (values[i] - predicted) ** 2;
    ssTot += (values[i] - yMean) ** 2;
  }
  
  const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
  
  return { slope, intercept, r2: Math.max(0, Math.min(1, r2)) };
}

// Step 4: Seasonality detection
function detectSeasonality(dates: Date[], values: number[]): Map<number, number> {
  const dayOfWeekAvg = new Map<number, { sum: number; count: number }>();
  
  dates.forEach((date, i) => {
    const dayOfWeek = date.getDay();
    const existing = dayOfWeekAvg.get(dayOfWeek) || { sum: 0, count: 0 };
    dayOfWeekAvg.set(dayOfWeek, {
      sum: existing.sum + values[i],
      count: existing.count + 1,
    });
  });
  
  const overallAvg = values.reduce((a, b) => a + b, 0) / values.length;
  const seasonalityMultipliers = new Map<number, number>();
  
  dayOfWeekAvg.forEach((data, dayOfWeek) => {
    const avg = data.sum / data.count;
    seasonalityMultipliers.set(dayOfWeek, overallAvg === 0 ? 1 : avg / overallAvg);
  });
  
  return seasonalityMultipliers;
}

// Step 5-6: Generate forecast with confidence bands
function generateForecast(
  historicalValues: number[],
  dates: Date[],
  horizon: number,
  regression: { slope: number; intercept: number; r2: number },
  seasonality: Map<number, number>,
  avgPricePerUnit: number,
  meanQty: number
): { forecastPoints: ForecastPoint[]; trend: 'up' | 'down' | 'stable' } {
  const forecastPoints: ForecastPoint[] = [];
  const lastDate = dates[dates.length - 1];

  // Relative slope threshold: 0.3% of mean qty per day is a meaningful trend
  const slopeThreshold = Math.max(0.01, meanQty * 0.003);
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (regression.slope > slopeThreshold) trend = 'up';
  else if (regression.slope < -slopeThreshold) trend = 'down';

  for (let i = 1; i <= horizon; i++) {
    const futureDate = addDays(lastDate, i);
    const dayOfWeek = futureDate.getDay();
    const seasonalMultiplier = seasonality.get(dayOfWeek) || 1;

    const timeIndex = dates.length - 1 + i;
    const basePrediction = regression.slope * timeIndex + regression.intercept;
    const predicted = Math.max(0, basePrediction * seasonalMultiplier);

    forecastPoints.push({
      date: formatDate(futureDate),
      predictedQty: Math.round(predicted),
      predictedRevenue: Math.round(predicted * avgPricePerUnit),
      lower: Math.round(predicted * 0.85),
      upper: Math.round(predicted * 1.15),
    });
  }

  return { forecastPoints, trend };
}

// Generate AI insights
function generateInsights(
  productForecasts: ProductForecast[],
  overallTrend: string,
  confidenceScore: number
): string[] {
  const insights: string[] = [];
  
  // Overall trend insight
  if (overallTrend === 'up') {
    insights.push('📈 Demand is trending upward. Consider increasing inventory and staffing to meet growing customer demand.');
  } else if (overallTrend === 'down') {
    insights.push('📉 Demand is trending downward. Review pricing strategy and consider promotional activities to stimulate sales.');
  } else {
    insights.push('➡️ Demand is stable. Maintain current inventory levels and monitor for seasonal changes.');
  }
  
  // Product-level insights
  const stockUpProducts = productForecasts.filter(p => p.tag === 'Stock Up');
  if (stockUpProducts.length > 0) {
    const names = stockUpProducts.map(p => p.productName).join(', ');
    insights.push(`🟢 Strong growth detected: ${names}. Increase stock levels to capitalize on rising demand.`);
  }
  
  const reduceProducts = productForecasts.filter(p => p.tag === 'Reduce Order');
  if (reduceProducts.length > 0) {
    const names = reduceProducts.map(p => p.productName).join(', ');
    insights.push(`🔴 Declining demand: ${names}. Reduce orders and consider clearance strategies.`);
  }
  
  // Confidence insight
  if (confidenceScore < 60) {
    insights.push('⚠️ Low confidence in forecast. Consider providing more historical data for better predictions.');
  }
  
  return insights;
}

// Main forecast function
export async function runForecast(records: SalesRecord[], horizon: number = 30): Promise<ForecastResult> {
  if (records.length === 0) {
    throw new Error('No sales data provided');
  }

  // Filter out records whose date doesn't parse to a real date
  const validRecords = records.filter(r => {
    const d = parseDate(r.date);
    return !isNaN(d.getTime());
  });

  if (validRecords.length === 0) {
    throw new Error(
      'None of your records have a recognisable date. ' +
      'Please check that the "Date" column contains actual dates (e.g. 2024-01-15 or 15/01/2024), ' +
      'not values like "in_stock" or product IDs.'
    );
  }

  if (validRecords.length < records.length * 0.4) {
    throw new Error(
      `Only ${validRecords.length} of ${records.length} rows have a valid date. ` +
      'Please re-check your Date column mapping.'
    );
  }

  // Sort records by date
  const sortedRecords = [...validRecords].sort((a, b) =>
    parseDate(a.date).getTime() - parseDate(b.date).getTime()
  );
  
  // Step 1: Aggregate by day
  const aggregated = aggregateByDay(sortedRecords);
  const dates = Array.from(aggregated.keys())
    .sort()
    .map(dateStr => parseDate(dateStr));
  const qtyValues = Array.from(aggregated.values()).map(v => v.qty);
  const revenueValues = Array.from(aggregated.values()).map(v => v.revenue);
  
  // Step 2: Calculate moving averages
  const ma7 = calculateWeightedMovingAverage(qtyValues, Math.min(7, qtyValues.length));

  // Step 3: Linear regression (on smoothed data for forecasting)
  const regression = linearRegression(ma7);

  // Separate regression on raw data for honest confidence scoring
  const rawRegression = linearRegression(qtyValues);

  // Step 4: Seasonality
  const seasonality = detectSeasonality(dates, qtyValues);

  // Avg price per unit from historical data
  const totalQty = qtyValues.reduce((a, b) => a + b, 0);
  const totalRevenue = revenueValues.reduce((a, b) => a + b, 0);
  const avgPricePerUnit = totalQty > 0 ? totalRevenue / totalQty : 1;
  const meanQty = totalQty / qtyValues.length;

  // Step 5-6: Generate forecast
  const { forecastPoints, trend } = generateForecast(qtyValues, dates, horizon, regression, seasonality, avgPricePerUnit, meanQty);
  
  // Product-level forecasts
  const productMap = new Map<string, SalesRecord[]>();
  sortedRecords.forEach(record => {
    if (!productMap.has(record.productName)) {
      productMap.set(record.productName, []);
    }
    productMap.get(record.productName)!.push(record);
  });
  
  const productForecasts: ProductForecast[] = [];
  productMap.forEach((productRecords, productName) => {
    const productAgg = aggregateByDay(productRecords);
    const productQty = Array.from(productAgg.values()).map(v => v.qty);
    const productRevenue = Array.from(productAgg.values()).map(v => v.revenue);
    
    const currentAvg = productQty.reduce((a, b) => a + b, 0) / productQty.length;
    const productMa7 = calculateWeightedMovingAverage(productQty, Math.min(7, productQty.length));
    const productRegression = linearRegression(productMa7);
    
    const futureAvg = productRegression.slope * (productQty.length + horizon / 2) + productRegression.intercept;
    const changePercent = ((futureAvg - currentAvg) / currentAvg) * 100;
    
    let productTrend: 'up' | 'down' | 'stable' = 'stable';
    if (changePercent > 5) productTrend = 'up';
    else if (changePercent < -5) productTrend = 'down';
    
    let tag: 'Stock Up' | 'Reduce Order' | 'Monitor' = 'Monitor';
    if (changePercent > 10) tag = 'Stock Up';
    else if (changePercent < -10) tag = 'Reduce Order';
    
    productForecasts.push({
      productName,
      currentAvg: Math.round(currentAvg),
      forecastedAvg: Math.round(futureAvg),
      changePercent: Math.round(changePercent * 10) / 10,
      trend: productTrend,
      tag,
    });
  });
  
  // Confidence: raw R² (0–79 pts) + data-size bonus (1 pt per day, up to 20)
  // Minimum 5 so we never show a flat 0% when we clearly ran a forecast
  const dataSizeBonus = Math.min(20, qtyValues.length);
  const confidenceScore = Math.max(5, Math.min(99, Math.round(rawRegression.r2 * 79) + dataSizeBonus));

  // Generate insights
  const insights = generateInsights(productForecasts, trend, confidenceScore);

  return {
    overallTrend: trend,
    confidenceScore,
    forecastData: forecastPoints,
    productForecasts,
    insights,
  };
}
