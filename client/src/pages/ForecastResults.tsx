import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendBadge } from '@/components/forecast/TrendBadge';
import {
  AreaChart, Area,
  ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Download, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

function getIdFromSearch(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('id');
}

export default function ForecastResults() {
  const [, setLocation] = useLocation();
  const forecastId = getIdFromSearch();

  const { data: forecast, isLoading, error } = trpc.forecast.get.useQuery(
    { id: forecastId! },
    { enabled: !!forecastId }
  );

  const { data: forecastList, isLoading: listLoading } = trpc.forecast.list.useQuery(
    undefined,
    { enabled: !forecastId }
  );

  // ── No ID in URL: show list of past forecasts ──────────────────────────────
  if (!forecastId) {
    return (
      <div className="bg-transparent p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">Forecasts</h1>
            <p className="text-slate-400">Select a forecast to view its results.</p>
          </div>

          {listLoading && (
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />Loading…
            </div>
          )}

          {!listLoading && (!forecastList || forecastList.length === 0) && (
            <Card className="p-8 text-center bg-white/[0.03] border-white/[0.06]">
              <p className="text-slate-400 mb-4">No forecasts yet. Upload sales data to generate your first forecast.</p>
              <Button
                className="bg-amber-400 text-slate-950 font-medium hover:bg-amber-300"
                onClick={() => setLocation('/upload')}
              >
                Upload Data
              </Button>
            </Card>
          )}

          <div className="space-y-3">
            {forecastList?.map(f => (
              <Card
                key={f.id}
                className="p-5 bg-white/[0.03] border-white/[0.06] hover:border-amber-400/30 transition-colors cursor-pointer"
                onClick={() => setLocation(`/forecast?id=${f.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-slate-200">
                      {new Date(f.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-slate-400 font-mono mt-1">
                      {f.horizon}-day horizon · Confidence: {f.confidenceScore}%
                    </p>
                  </div>
                  <TrendBadge trend={f.overallTrend as any} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          <p>Loading forecast…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !forecast) {
    return (
      <div className="bg-transparent p-8">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-slate-300 mb-4">{error?.message || 'Forecast not found.'}</p>
          <Button variant="outline" onClick={() => setLocation('/forecast')} className="border-white/20 text-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Forecasts
          </Button>
        </div>
      </div>
    );
  }

  const forecastData = Array.isArray(forecast.forecastData) ? forecast.forecastData : [];
  const productForecasts = Array.isArray(forecast.productForecasts) ? forecast.productForecasts : [];
  const insights = Array.isArray(forecast.insights) ? forecast.insights : [];

  const avgPredictedQty = forecastData.length > 0
    ? Math.round(forecastData.reduce((s: number, p: any) => s + (p.predictedQty || 0), 0) / forecastData.length)
    : 0;

  return (
    <div className="bg-transparent p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <button
              onClick={() => setLocation('/forecast')}
              className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1 mb-3 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />All Forecasts
            </button>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">Forecast Results</h1>
            <p className="text-lg text-slate-400">
              {forecast.horizon ?? 30}-day demand forecast · Generated{' '}
              {new Date(forecast.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-slate-300 hover:border-white/40 bg-transparent"
            onClick={() => setLocation('/upload')}
          >
            <Download className="w-4 h-4 mr-2" />
            New Forecast
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Overall Trend',      value: forecast.overallTrend?.toUpperCase() ?? '—' },
            { label: 'Confidence Score',   value: `${forecast.confidenceScore ?? 0}%` },
            { label: 'Forecast Period',    value: `${forecast.horizon ?? 30} Days` },
            { label: 'Avg Predicted Qty',  value: `${avgPredictedQty} units` },
          ].map((m, i) => (
            <Card key={i} className="p-4 bg-white/[0.03] border-white/[0.06] backdrop-blur-md">
              <p className="text-xs text-slate-400 mb-1">{m.label}</p>
              <p className="text-2xl font-mono font-bold text-slate-200">{m.value}</p>
            </Card>
          ))}
        </div>

        {/* Forecast Chart */}
        {forecastData.length > 0 && (
          <Card className="p-6 bg-white/[0.03] border-white/[0.06] backdrop-blur-md">
            <h2 className="text-2xl font-display font-bold mb-6">Demand Forecast — Next {forecast.horizon ?? 30} Days</h2>
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="qtyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1C1E26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  labelStyle={{ color: '#F1F0ED', fontFamily: 'DM Mono' }}
                  itemStyle={{ fontFamily: 'DM Mono' }}
                />
                <Area type="monotone" dataKey="predictedQty" stroke="#F59E0B" fill="url(#qtyGrad)" strokeWidth={2} name="Predicted Qty" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Confidence Bands */}
        {forecastData.length > 0 && (
          <Card className="p-6 bg-white/[0.03] border-white/[0.06] backdrop-blur-md">
            <h2 className="text-2xl font-display font-bold mb-6">Confidence Range</h2>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1C1E26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  itemStyle={{ fontFamily: 'DM Mono' }}
                />
                <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: 12 }} />
                <Bar dataKey="lower"        fill="#0D9488" opacity={0.3} name="Lower Bound" />
                <Line type="monotone" dataKey="predictedQty" stroke="#F59E0B" strokeWidth={2} dot={false} name="Forecast" />
                <Bar dataKey="upper"        fill="#0D9488" opacity={0.3} name="Upper Bound" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Product-Level Forecasts */}
        {productForecasts.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold mb-6">Product-Level Forecast</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {productForecasts.map((product: any, i: number) => (
                <Card key={i} className="p-6 bg-white/[0.03] border-white/[0.06] hover:border-amber-400/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-display font-bold text-lg text-slate-200 truncate mr-2">{product.productName}</h3>
                    <TrendBadge trend={product.trend} value={product.changePercent} />
                  </div>
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Current Avg / day</p>
                      <p className="text-2xl font-mono font-bold text-slate-200">{product.currentAvg}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Forecasted Avg (30 days)</p>
                      <p className="text-2xl font-mono font-bold text-teal-400">{product.forecastedAvg}</p>
                    </div>
                  </div>
                  <Badge
                    variant={product.tag === 'Stock Up' ? 'default' : product.tag === 'Reduce Order' ? 'destructive' : 'secondary'}
                    className={product.tag === 'Monitor' ? 'bg-[#1C1E26] text-slate-300' : ''}
                  >
                    {product.tag}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {insights.length > 0 && (
          <Card className="p-6 bg-teal-500/10 border-teal-500/20">
            <div className="flex gap-4">
              <AlertCircle className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-bold text-lg mb-3 text-slate-200">Key Insights</h3>
                <ul className="space-y-2.5 text-sm text-slate-300 leading-relaxed">
                  {insights.map((insight: string, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-teal-400 font-mono shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Button
            size="lg"
            className="bg-amber-400 text-slate-950 font-medium hover:bg-amber-300"
            onClick={() => setLocation('/upload')}
          >
            Run Another Forecast
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-white/20 text-slate-300 hover:border-white/40 bg-transparent"
            onClick={() => setLocation('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
