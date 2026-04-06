import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendBadge } from '@/components/forecast/TrendBadge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

// Mock data
const salesHistory = [
  { date: '2026-03-01', revenue: 45000, quantity: 450 },
  { date: '2026-03-02', revenue: 52000, quantity: 520 },
  { date: '2026-03-03', revenue: 48000, quantity: 480 },
  { date: '2026-03-04', revenue: 61000, quantity: 610 },
  { date: '2026-03-05', revenue: 55000, quantity: 550 },
  { date: '2026-03-06', revenue: 67000, quantity: 670 },
  { date: '2026-03-07', revenue: 59000, quantity: 590 },
];

const productBreakdown = [
  { name: 'Widget A', value: 35, revenue: 52500 },
  { name: 'Widget B', value: 30, revenue: 45000 },
  { name: 'Gadget X', value: 20, revenue: 30000 },
  { name: 'Other', value: 15, revenue: 22500 },
];

const COLORS = ['#4f46e5', '#06b6d4', '#ec4899', '#f59e0b'];

const insights = [
  { icon: TrendingUp, title: 'Strong Growth', description: 'Revenue up 15% this week', color: 'text-green-600' },
  { icon: AlertCircle, title: 'Widget A Peak', description: 'Highest demand on Fridays', color: 'text-blue-600' },
  { icon: BarChart3, title: 'Seasonal Pattern', description: 'Weekend sales 20% higher', color: 'text-purple-600' },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">Dashboard</h1>
            <p className="text-lg text-muted-foreground font-serif">
              Your sales performance and forecasts at a glance
            </p>
          </div>
          <Button variant="primary" size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Forecast
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue (7d)', value: '₹387,000', trend: '+12%' },
            { label: 'Avg Daily Sales', value: '₹55,286', trend: '+8%' },
            { label: 'Total Units Sold', value: '3,870', trend: '+15%' },
            { label: 'Forecast Accuracy', value: '92%', trend: 'Excellent' },
          ].map((metric, i) => (
            <Card key={i} className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-serif font-bold">{metric.value}</p>
                <TrendBadge trend={metric.trend === '+12%' ? 'up' : metric.trend === '+8%' ? 'up' : metric.trend === '+15%' ? 'up' : 'stable'} />
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales History */}
          <Card className="p-6">
            <h2 className="text-2xl font-serif font-bold mb-6">Sales History (7 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                  labelStyle={{ color: 'var(--foreground)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Product Breakdown */}
          <Card className="p-6">
            <h2 className="text-2xl font-serif font-bold mb-6">Product Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Quantity vs Revenue */}
        <Card className="p-6">
          <h2 className="text-2xl font-serif font-bold mb-6">Quantity vs Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Legend />
              <Bar dataKey="quantity" fill="#06b6d4" name="Quantity Sold" />
              <Bar dataKey="revenue" fill="#4f46e5" name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Insights Feed */}
        <div>
          <h2 className="text-2xl font-serif font-bold mb-6">AI Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((insight, i) => {
              const Icon = insight.icon;
              return (
                <Card key={i} className="p-6 hover:shadow-md transition-shadow">
                  <Icon className={`w-8 h-8 ${insight.color} mb-4`} />
                  <h3 className="font-serif font-bold text-lg mb-2">{insight.title}</h3>
                  <p className="text-muted-foreground font-serif">{insight.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Forecasts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold">Recent Forecasts</h2>
            <Button variant="ghost">View All</Button>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Q1 Sales Data', date: '2026-04-05', accuracy: '92%', status: 'Completed' },
              { name: 'March Forecast', date: '2026-04-03', accuracy: '88%', status: 'Completed' },
              { name: 'February Analysis', date: '2026-04-01', accuracy: '85%', status: 'Completed' },
            ].map((forecast, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors">
                <div>
                  <p className="font-serif font-bold">{forecast.name}</p>
                  <p className="text-sm text-muted-foreground">{forecast.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{forecast.accuracy}</Badge>
                  <span className="text-sm font-medium text-green-600">{forecast.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
