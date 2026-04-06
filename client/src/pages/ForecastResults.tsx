import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendBadge } from '@/components/forecast/TrendBadge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart } from 'recharts';
import { Download, Share2, AlertCircle } from 'lucide-react';

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

// Mock data for demonstration
const mockForecastData: ForecastPoint[] = [
  { date: '2026-04-07', predictedQty: 450, predictedRevenue: 22500, lower: 382, upper: 517 },
  { date: '2026-04-08', predictedQty: 480, predictedRevenue: 24000, lower: 408, upper: 552 },
  { date: '2026-04-09', predictedQty: 510, predictedRevenue: 25500, lower: 433, upper: 587 },
  { date: '2026-04-10', predictedQty: 520, predictedRevenue: 26000, lower: 442, upper: 598 },
];

const mockProductForecasts: ProductForecast[] = [
  { productName: 'Widget A', currentAvg: 100, forecastedAvg: 112, changePercent: 12, trend: 'up', tag: 'Stock Up' },
  { productName: 'Widget B', currentAvg: 150, forecastedAvg: 165, changePercent: 10, trend: 'up', tag: 'Stock Up' },
  { productName: 'Gadget X', currentAvg: 80, forecastedAvg: 72, changePercent: -10, trend: 'down', tag: 'Reduce Order' },
];

export default function ForecastResults() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Forecast Results</h1>
            <p className="text-lg text-muted-foreground font-serif">
              30-day demand forecast with confidence bands
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Overall Trend', value: 'Upward', badge: 'up' },
            { label: 'Confidence Score', value: '85%', badge: 'info' },
            { label: 'Forecast Period', value: '30 Days', badge: 'info' },
            { label: 'Avg. Predicted Qty', value: '490 units', badge: 'info' },
          ].map((metric, i) => (
            <Card key={i} className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
              <p className="text-2xl font-serif font-bold mb-2">{metric.value}</p>
            </Card>
          ))}
        </div>

        {/* Main Forecast Chart */}
        <Card className="p-6">
          <h2 className="text-2xl font-serif font-bold mb-6">Demand Forecast (Next 30 Days)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={mockForecastData}>
              <defs>
                <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Area 
                type="monotone" 
                dataKey="predictedQty" 
                stroke="#4f46e5" 
                fillOpacity={1} 
                fill="url(#colorQty)"
                name="Predicted Quantity"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Confidence Bands */}
        <Card className="p-6">
          <h2 className="text-2xl font-serif font-bold mb-6">Confidence Range</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={mockForecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Legend />
              <Bar dataKey="lower" fill="#ef4444" opacity={0.3} name="Lower Bound" />
              <Line type="monotone" dataKey="predictedQty" stroke="#4f46e5" strokeWidth={2} name="Forecast" />
              <Bar dataKey="upper" fill="#22c55e" opacity={0.3} name="Upper Bound" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* Product-Level Forecasts */}
        <div>
          <h2 className="text-2xl font-serif font-bold mb-6">Product-Level Forecast</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockProductForecasts.map((product, i) => (
              <Card key={i} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-serif font-bold text-lg">{product.productName}</h3>
                  <TrendBadge trend={product.trend} value={product.changePercent} />
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Avg</p>
                    <p className="text-2xl font-serif font-bold">{product.currentAvg}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Forecasted Avg (30 days)</p>
                    <p className="text-2xl font-serif font-bold text-accent">{product.forecastedAvg}</p>
                  </div>
                </div>

                <Badge variant={product.tag === 'Stock Up' ? 'default' : product.tag === 'Reduce Order' ? 'destructive' : 'secondary'}>
                  {product.tag}
                </Badge>
              </Card>
            ))}
          </div>
        </div>

        {/* Insights */}
        <Card className="p-6 bg-accent/5 border-accent/20">
          <div className="flex gap-4">
            <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif font-bold text-lg mb-2">Key Insights</h3>
              <ul className="space-y-2 text-sm text-foreground/80 font-serif">
                <li>• Overall demand is trending upward with a 12% increase expected in the next 30 days</li>
                <li>• Widget A and Widget B show strong growth — consider increasing inventory</li>
                <li>• Gadget X demand is declining — reduce orders to avoid excess stock</li>
                <li>• Forecast confidence is high (85%) due to consistent historical patterns</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button variant="primary" size="lg">
            Generate Report
          </Button>
          <Button variant="outline" size="lg">
            Run Another Forecast
          </Button>
        </div>
      </div>
    </div>
  );
}
