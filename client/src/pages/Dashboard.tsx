import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendBadge } from '@/components/forecast/TrendBadge';
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Plus, BarChart3, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

const COLORS = ['#F59E0B', '#0D9488', '#94A3B8', '#475569', '#6366F1', '#EC4899'];

function fmt(n: number) {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: datasets, isLoading: datasetsLoading } = trpc.data.list.useQuery();
  const latestDatasetId = datasets?.[0]?.id;

  const { data: latestDataset, isLoading: recordsLoading } = trpc.data.get.useQuery(
    { id: latestDatasetId! },
    { enabled: !!latestDatasetId }
  );

  const { data: forecasts, isLoading: forecastsLoading } = trpc.forecast.list.useQuery();

  const isLoading = datasetsLoading || (!!latestDatasetId && recordsLoading);
  const hasData = !!latestDataset?.records?.length;

  // ── Derived metrics from latest dataset ───────────────────────────────────
  const metrics = useMemo(() => {
    if (!hasData) return null;
    const records: any[] = Array.isArray(latestDataset.records)
      ? latestDataset.records
      : JSON.parse(latestDataset.records as any);

    const totalRevenue = records.reduce((s, r) => s + (Number(r.revenue) || 0), 0);
    const totalUnits   = records.reduce((s, r) => s + (Number(r.quantitySold) || 0), 0);

    // Unique days
    const days = new Set(records.map(r => String(r.date).split('T')[0])).size || 1;
    const avgDailyRevenue = totalRevenue / days;

    const latestForecast = forecasts?.[0];
    const accuracy = latestForecast ? `${latestForecast.confidenceScore}%` : '—';

    return { totalRevenue, totalUnits, avgDailyRevenue, accuracy };
  }, [hasData, latestDataset, forecasts]);

  // ── Last-N-days aggregation for charts ────────────────────────────────────
  const salesHistory = useMemo(() => {
    if (!hasData) return [];
    const records: any[] = Array.isArray(latestDataset.records)
      ? latestDataset.records
      : JSON.parse(latestDataset.records as any);

    const byDay = new Map<string, { revenue: number; quantity: number }>();
    records.forEach(r => {
      const day = String(r.date).split('T')[0];
      const existing = byDay.get(day) || { revenue: 0, quantity: 0 };
      byDay.set(day, {
        revenue: existing.revenue + (Number(r.revenue) || 0),
        quantity: existing.quantity + (Number(r.quantitySold) || 0),
      });
    });

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14) // last 14 days
      .map(([date, v]) => ({ date, ...v }));
  }, [hasData, latestDataset]);

  // ── Product breakdown ─────────────────────────────────────────────────────
  const productBreakdown = useMemo(() => {
    if (!hasData) return [];
    const records: any[] = Array.isArray(latestDataset.records)
      ? latestDataset.records
      : JSON.parse(latestDataset.records as any);

    const byProduct = new Map<string, { qty: number; revenue: number }>();
    records.forEach(r => {
      const name = String(r.productName || 'Unknown');
      const existing = byProduct.get(name) || { qty: 0, revenue: 0 };
      byProduct.set(name, {
        qty: existing.qty + (Number(r.quantitySold) || 0),
        revenue: existing.revenue + (Number(r.revenue) || 0),
      });
    });

    const entries = Array.from(byProduct.entries())
      .sort(([, a], [, b]) => b.qty - a.qty)
      .slice(0, 6);

    const totalQty = entries.reduce((s, [, v]) => s + v.qty, 0);
    return entries.map(([name, v]) => ({
      name,
      value: Math.round((v.qty / totalQty) * 100),
      revenue: v.revenue,
    }));
  }, [hasData, latestDataset]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          <p>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Empty State ────────────────────────────────────────────────────────────
  if (!hasData) {
    return (
      <div className="bg-transparent p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">Dashboard</h1>
              <p className="text-lg text-slate-400">Upload your first dataset to see analytics here.</p>
            </div>
          </div>
          <Card className="p-12 text-center bg-white/[0.03] border-white/[0.06] border-dashed">
            <BarChart3 className="w-14 h-14 text-slate-500 mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-slate-200 mb-2">No data yet</h2>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">
              Upload a CSV or Excel file with your sales history and we'll generate forecasts, charts, and insights automatically.
            </p>
            <Button
              size="lg"
              className="bg-amber-400 text-slate-950 font-semibold hover:bg-amber-300"
              onClick={() => setLocation('/upload')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Your First Dataset
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── Full Dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="bg-transparent p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">Dashboard</h1>
            <p className="text-lg text-slate-400">
              Dataset: <span className="text-amber-400">{datasets?.[0]?.datasetName}</span>
              {' · '}{datasets?.[0]?.recordCount?.toLocaleString()} records
            </p>
          </div>
          <Button
            className="bg-amber-400 text-slate-950 font-medium hover:bg-amber-300"
            size="lg"
            onClick={() => setLocation('/upload')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Forecast
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics && [
            { label: 'Total Revenue',    value: fmt(metrics.totalRevenue),              trend: 'up' as const },
            { label: 'Avg Daily Sales',  value: fmt(metrics.avgDailyRevenue),            trend: 'up' as const },
            { label: 'Total Units Sold', value: metrics.totalUnits.toLocaleString(),     trend: 'up' as const },
            { label: 'Forecast Accuracy',value: metrics.accuracy,                        trend: 'stable' as const },
          ].map((m, i) => (
            <Card key={i} className="p-4 bg-white/[0.03] border-white/[0.06] backdrop-blur-md">
              <p className="text-xs text-slate-400 mb-1">{m.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-mono font-bold text-slate-200">{m.value}</p>
                <TrendBadge trend={m.trend} />
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Revenue History */}
          <Card className="p-6 bg-white/[0.03] border-white/[0.06] backdrop-blur-md">
            <h2 className="text-xl font-display font-bold mb-5">Revenue History</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={salesHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1C1E26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  formatter={(v: any) => [fmt(v), 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} dot={false} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Product Breakdown */}
          <Card className="p-6 bg-white/[0.03] border-white/[0.06] backdrop-blur-md">
            <h2 className="text-xl font-display font-bold mb-5">Product Mix</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={productBreakdown}
                  cx="50%" cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={false}
                  style={{ fontSize: '11px', fill: '#94A3B8' }}
                >
                  {productBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1C1E26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  formatter={(v: any, _: any, { payload }: any) => [`${v}% · ${fmt(payload.revenue)}`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Qty vs Revenue */}
        <Card className="p-6 bg-white/[0.03] border-white/[0.06] backdrop-blur-md">
          <h2 className="text-xl font-display font-bold mb-5">Quantity vs Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1C1E26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                formatter={(v: any, name: string) => [name === 'Revenue' ? fmt(v) : v, name]}
              />
              <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: 12 }} />
              <Bar yAxisId="left"  dataKey="quantity" fill="#0D9488" name="Qty Sold" />
              <Bar yAxisId="right" dataKey="revenue"  fill="#F59E0B" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* AI Insights row */}
        {forecasts?.[0] && (
          <div>
            <h2 className="text-2xl font-display font-bold mb-5">Latest Forecast Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: TrendingUp, title: 'Overall Trend', description: `Demand is trending ${forecasts[0].overallTrend}`, color: 'text-amber-500' },
                { icon: BarChart3,  title: 'Confidence',    description: `${forecasts[0].confidenceScore}% forecast accuracy`, color: 'text-teal-500' },
                { icon: AlertCircle, title: 'Horizon',      description: `${forecasts[0].horizon}-day forecast generated`, color: 'text-slate-400' },
              ].map((insight, i) => {
                const Icon = insight.icon;
                return (
                  <Card key={i} className="p-5 bg-white/[0.03] border-white/[0.06] hover:border-teal-500/30 transition-colors">
                    <Icon className={`w-7 h-7 ${insight.color} mb-3`} />
                    <h3 className="font-display font-bold text-base mb-1 text-slate-200">{insight.title}</h3>
                    <p className="text-slate-400 text-sm">{insight.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Forecasts */}
        {!forecastsLoading && forecasts && forecasts.length > 0 && (
          <Card className="p-6 bg-white/[0.03] border-white/[0.06] backdrop-blur-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-display font-bold">Recent Forecasts</h2>
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white text-sm"
                onClick={() => setLocation('/forecast')}
              >
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {forecasts.slice(0, 5).map(f => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.04] rounded-lg hover:border-amber-400/30 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/forecast?id=${f.id}`)}
                >
                  <div>
                    <p className="font-display font-bold text-slate-200">
                      {new Date(f.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-slate-400 font-mono mt-0.5">{f.horizon}-day horizon</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-[#1C1E26] text-slate-300 font-mono">
                      {f.confidenceScore}%
                    </Badge>
                    <TrendBadge trend={f.overallTrend as any} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
