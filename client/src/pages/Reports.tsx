import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendBadge } from '@/components/forecast/TrendBadge';
import {
  Download, FileText, Database, Loader2, Eye,
  BarChart3, Plus, FileSpreadsheet, CalendarDays, Package,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import jsPDF from 'jspdf';

// ─────────────────────────────────────────────────────────────────────────────
// Client-side PDF generation — no server / no S3 needed
// ─────────────────────────────────────────────────────────────────────────────
function stripEmoji(str: string): string {
  // jsPDF's default font doesn't support emoji — strip them
  return str.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim();
}

function generateForecastPDF(forecast: any, datasetName = 'Forecast Report'): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const CW = W - 2 * M;
  let y = 0;

  const checkPage = (needed = 14) => {
    if (y + needed > H - M) { doc.addPage(); y = M; }
  };

  // ── Dark header bar ──────────────────────────────────────────────────────
  doc.setFillColor(15, 17, 23);
  doc.rect(0, 0, W, 26, 'F');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11); // amber
  doc.text('ForecastIQ', M, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('AI-Powered Demand Forecast Report', M, 20);

  y = 34;

  // ── Report title ─────────────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(datasetName, M, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Generated: ${new Date(forecast.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`,
    M, y
  );
  y += 12;

  // ── Metric boxes ─────────────────────────────────────────────────────────
  const metrics = [
    { label: 'Overall Trend',    value: (forecast.overallTrend || 'stable').toUpperCase() },
    { label: 'Confidence Score', value: `${forecast.confidenceScore ?? 0}%` },
    { label: 'Forecast Horizon', value: `${forecast.horizon ?? 30} Days` },
  ];
  const bw = (CW - 8) / 3;
  metrics.forEach((m, i) => {
    const bx = M + i * (bw + 4);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(bx, y, bw, 18, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, bx + 3, y + 7);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(m.value, bx + 3, y + 14.5);
  });
  y += 26;

  // ── Section divider helper ────────────────────────────────────────────────
  const sectionHeader = (title: string) => {
    checkPage(16);
    doc.setFillColor(241, 245, 249);
    doc.rect(M, y, CW, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(title, M + 3, y + 5.5);
    y += 12;
  };

  // ── Product-level forecast table ─────────────────────────────────────────
  const productForecasts = Array.isArray(forecast.productForecasts) ? forecast.productForecasts : [];
  if (productForecasts.length > 0) {
    sectionHeader('Product-Level Forecast');

    // Column header row
    doc.setFillColor(30, 41, 59);
    doc.rect(M, y - 1, CW, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const cols = [M + 2, M + 68, M + 104, M + 138, M + 163];
    ['Product', 'Curr Avg / Day', 'Forecast Avg', 'Change %', 'Action'].forEach((h, i) => {
      doc.text(h, cols[i], y + 5);
    });
    y += 10;

    productForecasts.forEach((p: any, idx: number) => {
      checkPage(9);
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(M, y - 1, CW, 8, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);

      const name = String(p.productName || '').substring(0, 28);
      doc.text(name, cols[0], y + 5);
      doc.text(String(p.currentAvg ?? 0), cols[1], y + 5);
      doc.text(String(p.forecastedAvg ?? 0), cols[2], y + 5);

      const chg = p.changePercent ?? 0;
      doc.setTextColor(chg > 0 ? 5 : chg < 0 ? 220 : 100, chg > 0 ? 150 : chg < 0 ? 38 : 100, chg > 0 ? 105 : chg < 0 ? 38 : 100);
      doc.text(`${chg > 0 ? '+' : ''}${chg}%`, cols[3], y + 5);

      doc.setTextColor(15, 23, 42);
      doc.text(p.tag || 'Monitor', cols[4], y + 5);

      y += 9;
    });
    y += 6;
  }

  // ── Insights ──────────────────────────────────────────────────────────────
  const insights = Array.isArray(forecast.insights) ? forecast.insights : [];
  if (insights.length > 0) {
    sectionHeader('Key Insights');
    insights.forEach((insight: string, i: number) => {
      checkPage(12);
      const clean = stripEmoji(insight);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(`${i + 1}.  ${clean}`, CW - 4);
      doc.text(lines, M + 3, y);
      y += lines.length * 5.5 + 2;
    });
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let pg = 1; pg <= pageCount; pg++) {
    doc.setPage(pg);
    doc.setFillColor(241, 245, 249);
    doc.rect(0, H - 10, W, 10, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Generated by ForecastIQ · forecastiq.app', M, H - 3.5);
    doc.text(`Page ${pg} / ${pageCount}`, W - M - 14, H - 3.5);
  }

  doc.save(`ForecastIQ-Report-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Client-side CSV generation
// ─────────────────────────────────────────────────────────────────────────────
function generateForecastCSV(forecast: any, datasetName = 'Forecast'): void {
  const productForecasts = Array.isArray(forecast.productForecasts) ? forecast.productForecasts : [];
  const insights = Array.isArray(forecast.insights) ? forecast.insights : [];

  const rows = [
    ['ForecastIQ - Demand Forecast Report'],
    ['Dataset', datasetName],
    ['Generated', new Date(forecast.generatedAt).toLocaleString()],
    ['Overall Trend', forecast.overallTrend],
    ['Confidence Score', `${forecast.confidenceScore}%`],
    ['Forecast Horizon', `${forecast.horizon ?? 30} days`],
    [],
    ['PRODUCT FORECAST'],
    ['Product Name', 'Current Avg/Day', 'Forecasted Avg', 'Change %', 'Recommendation'],
    ...productForecasts.map((p: any) => [
      p.productName,
      p.currentAvg,
      p.forecastedAvg,
      `${p.changePercent > 0 ? '+' : ''}${p.changePercent}%`,
      p.tag,
    ]),
    [],
    ['KEY INSIGHTS'],
    ...insights.map((s: string, i: number) => [`${i + 1}. ${stripEmoji(s)}`]),
  ];

  const csv = rows
    .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, "'")}"`).join(','))
    .join('\n');

  blobDownload(csv, 'text/csv', `ForecastIQ-${new Date().toISOString().split('T')[0]}.csv`);
}

function generateDatasetCSV(records: any[], datasetName: string): void {
  if (records.length === 0) return;
  const headers = ['date', 'productName', 'category', 'quantitySold', 'revenue'];
  const csv = [
    headers.join(','),
    ...records.map(r => headers.map(h => `"${String(r[h] ?? '')}"`).join(',')),
  ].join('\n');
  blobDownload(csv, 'text/csv', `${datasetName.replace(/\s+/g, '-')}-raw.csv`);
}

function blobDownload(content: string, mime: string, filename: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
type DownloadState = { id: string; type: 'pdf' | 'csv' | 'raw' } | null;

export default function Reports() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'forecasts' | 'datasets'>('forecasts');
  const [downloading, setDownloading] = useState<DownloadState>(null);

  const { data: datasets, isLoading: datasetsLoading } = trpc.data.list.useQuery();
  const { data: forecasts, isLoading: forecastsLoading } = trpc.forecast.list.useQuery();
  const utils = trpc.useUtils();

  const handleDownloadPDF = async (forecastId: string, label: string) => {
    setDownloading({ id: forecastId, type: 'pdf' });
    try {
      const full = await utils.forecast.get.fetch({ id: forecastId });
      generateForecastPDF(full, label);
    } catch (e: any) {
      alert(`Could not generate PDF: ${e.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadCSV = async (forecastId: string, label: string) => {
    setDownloading({ id: forecastId, type: 'csv' });
    try {
      const full = await utils.forecast.get.fetch({ id: forecastId });
      generateForecastCSV(full, label);
    } catch (e: any) {
      alert(`Could not generate CSV: ${e.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadDataset = async (datasetId: string, datasetName: string) => {
    setDownloading({ id: datasetId, type: 'raw' });
    try {
      const ds = await utils.data.get.fetch({ id: datasetId });
      const records = Array.isArray(ds.records)
        ? ds.records
        : JSON.parse(ds.records as any);
      generateDatasetCSV(records, datasetName);
    } catch (e: any) {
      alert(`Could not export dataset: ${e.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const isLoading = forecastsLoading || datasetsLoading;
  const isBusy = (id: string, type: DownloadState['type']) =>
    downloading?.id === id && downloading?.type === type;

  // ── Empty state ────────────────────────────────────────────────────────────
  const noForecasts = !forecastsLoading && (!forecasts || forecasts.length === 0);
  const noDatasets  = !datasetsLoading  && (!datasets  || datasets.length  === 0);

  return (
    <div className="bg-transparent p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">Reports</h1>
            <p className="text-lg text-slate-400">
              Download forecast reports and view your upload history.
            </p>
          </div>
          <Button
            className="bg-amber-400 text-slate-950 font-medium hover:bg-amber-300"
            onClick={() => setLocation('/upload')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Upload
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/[0.04] rounded-lg w-fit border border-white/[0.06]">
          {([
            { key: 'forecasts', label: 'Forecast Reports', Icon: BarChart3 },
            { key: 'datasets',  label: 'Upload History',   Icon: Database  },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${activeTab === key
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Forecast Reports Tab ──────────────────────────────────────────── */}
        {activeTab === 'forecasts' && (
          <div className="space-y-4">
            {forecastsLoading && (
              <div className="flex items-center gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading forecasts…
              </div>
            )}

            {noForecasts && (
              <Card className="p-12 text-center bg-white/[0.03] border-white/[0.06] border-dashed">
                <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold text-slate-200 mb-2">No forecasts yet</h3>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                  Upload sales data to generate your first forecast — then come back here to download the report.
                </p>
                <Button
                  className="bg-amber-400 text-slate-950 font-medium hover:bg-amber-300"
                  onClick={() => setLocation('/upload')}
                >
                  Upload Sales Data
                </Button>
              </Card>
            )}

            {forecasts?.map((f) => {
              const label = new Date(f.generatedAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              });
              return (
                <Card
                  key={f.id}
                  className="p-6 bg-white/[0.03] border-white/[0.06] hover:border-amber-400/20 transition-colors"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                    <div>
                      <p className="font-display font-bold text-lg text-slate-200 mb-1">
                        Forecast · {label}
                      </p>
                      <p className="text-sm text-slate-400 font-mono">
                        {f.horizon}-day horizon
                      </p>
                    </div>
                    <TrendBadge trend={f.overallTrend as any} />
                  </div>

                  {/* Metric strip */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: 'Trend',      value: (f.overallTrend || '—').toUpperCase() },
                      { label: 'Confidence', value: `${f.confidenceScore}%` },
                      { label: 'Horizon',    value: `${f.horizon} days` },
                      { label: 'Generated',  value: label },
                    ].map(({ label: lbl, value }) => (
                      <div key={lbl} className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-0.5">{lbl}</p>
                        <p className="text-sm font-mono font-bold text-slate-200">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/[0.12] text-slate-300 hover:border-amber-400/40 bg-transparent"
                      onClick={() => setLocation(`/forecast?id=${f.id}`)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View Results
                    </Button>

                    <Button
                      size="sm"
                      className="bg-amber-400 text-slate-950 hover:bg-amber-300 font-medium"
                      disabled={isBusy(f.id, 'pdf')}
                      onClick={() => handleDownloadPDF(f.id, `Forecast ${label}`)}
                    >
                      {isBusy(f.id, 'pdf')
                        ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating…</>
                        : <><FileText className="w-3.5 h-3.5 mr-1.5" />Download PDF</>}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/[0.12] text-slate-300 hover:border-teal-400/40 bg-transparent"
                      disabled={isBusy(f.id, 'csv')}
                      onClick={() => handleDownloadCSV(f.id, `Forecast ${label}`)}
                    >
                      {isBusy(f.id, 'csv')
                        ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Exporting…</>
                        : <><FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />Download CSV</>}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Upload History Tab ────────────────────────────────────────────── */}
        {activeTab === 'datasets' && (
          <div className="space-y-4">
            {datasetsLoading && (
              <div className="flex items-center gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading uploads…
              </div>
            )}

            {noDatasets && (
              <Card className="p-12 text-center bg-white/[0.03] border-white/[0.06] border-dashed">
                <Database className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold text-slate-200 mb-2">No uploads yet</h3>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                  Upload a CSV or Excel file with your sales data to get started.
                </p>
                <Button
                  className="bg-amber-400 text-slate-950 font-medium hover:bg-amber-300"
                  onClick={() => setLocation('/upload')}
                >
                  Upload Sales Data
                </Button>
              </Card>
            )}

            {datasets?.map((ds) => (
              <Card
                key={ds.id}
                className="p-6 bg-white/[0.03] border-white/[0.06] hover:border-teal-400/20 transition-colors"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Database className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg text-slate-200 mb-1">
                        {ds.datasetName}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Package className="w-3.5 h-3.5" />
                          {ds.recordCount?.toLocaleString() ?? 0} records
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <CalendarDays className="w-3.5 h-3.5" />
                          Uploaded {new Date(ds.uploadedAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        <Badge variant="secondary" className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-xs">
                          Stored in MongoDB
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/[0.12] text-slate-300 hover:border-amber-400/40 bg-transparent"
                      onClick={() => setLocation('/dashboard')}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View on Dashboard
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/[0.12] text-slate-300 hover:border-teal-400/40 bg-transparent"
                      disabled={isBusy(ds.id, 'raw')}
                      onClick={() => handleDownloadDataset(ds.id, ds.datasetName)}
                    >
                      {isBusy(ds.id, 'raw')
                        ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Exporting…</>
                        : <><Download className="w-3.5 h-3.5 mr-1.5" />Export Raw CSV</>}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Storage explanation */}
            {!noDatasets && (
              <Card className="p-4 bg-teal-500/5 border-teal-500/20 mt-2">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-teal-400 font-semibold">Where is my data stored?</span>{' '}
                  Your uploaded records are saved securely in MongoDB Atlas — the same database that powers your forecasts.
                  They are never stored as files on disk. You can export them back to CSV at any time using the button above.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
