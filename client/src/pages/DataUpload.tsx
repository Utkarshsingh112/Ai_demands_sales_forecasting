import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Upload, FileUp, AlertCircle, CheckCircle2, Loader2,
  Calendar, Package, Hash, DollarSign, Tag, ChevronDown,
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface SalesRecord {
  date: string;
  productName: string;
  category?: string;
  quantitySold: number;
  revenue: number;
}

interface Detection {
  mapping: Partial<Record<FieldKey, string>>;
  confidence: Partial<Record<FieldKey, number>>; // 0–1
}

type FieldKey = 'date' | 'productName' | 'quantitySold' | 'revenue' | 'category';

interface FieldMeta {
  key: FieldKey;
  label: string;
  Icon: React.ComponentType<any>;
  required: boolean;
}

const FIELDS: FieldMeta[] = [
  { key: 'date',         label: 'Date',          Icon: Calendar,     required: true },
  { key: 'productName',  label: 'Product Name',  Icon: Package,      required: true },
  { key: 'quantitySold', label: 'Quantity Sold', Icon: Hash,         required: true },
  { key: 'revenue',      label: 'Revenue',       Icon: DollarSign,   required: true },
  { key: 'category',     label: 'Category',      Icon: Tag,          required: false },
];

// Confidence threshold below which we show a correction dropdown
const LOW_CONFIDENCE = 0.55;

// ─────────────────────────────────────────────────────────────────────────────
// Smart column detector — name + content scoring
// ─────────────────────────────────────────────────────────────────────────────
function detectColumns(headers: string[], rows: any[]): Detection {
  const sample = rows.slice(0, Math.min(30, rows.length));

  // Score matrix: score[header][fieldKey]
  const score: Record<string, Record<FieldKey, number>> = {};
  headers.forEach(h => {
    score[h] = { date: 0, productName: 0, quantitySold: 0, revenue: 0, category: 0 };
  });

  headers.forEach(h => {
    const lc = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s = score[h];

    // ── Name-based scoring ───────────────────────────────────────────────────
    if (lc.includes('date') || lc === 'dt' || lc === 'day' || lc === 'period' || lc === 'month' || lc === 'week') s.date += 10;
    if (lc.includes('product') || lc.includes('item') || lc.includes('sku') || lc === 'prod' || lc === 'goods') s.productName += 10;
    if (lc.includes('name') && !lc.includes('date')) s.productName += 5;
    if (lc.includes('qty') || lc.includes('quant') || lc.includes('units') || lc === 'sold' || lc === 'count' || lc === 'vol' || lc.includes('volume')) s.quantitySold += 10;
    if (lc.includes('revenue') || lc === 'sales' || lc.includes('amount') || lc.includes('total') || lc.includes('income') || lc.includes('turnover')) s.revenue += 10;
    if (lc.includes('price') || lc.includes('value') || lc.includes('earn')) s.revenue += 7;
    if (lc.includes('categ') || lc === 'type' || lc === 'group' || lc === 'segment' || lc === 'class' || lc === 'division') s.category += 10;

    // ── Content-based scoring ────────────────────────────────────────────────
    const vals = sample.map(r => r[h]).filter(v => v !== '' && v !== null && v !== undefined);
    if (vals.length === 0) return;

    // Date detection — try to parse as date
    const dateParsed = vals.filter(v => {
      if (v instanceof Date) return true;
      if (typeof v === 'number' && v > 40000 && v < 55000) return true; // Excel serial range
      const str = String(v).trim();
      if (str.length < 6) return false;
      const d = new Date(str);
      return !isNaN(d.getTime());
    });
    const dateRatio = dateParsed.length / vals.length;
    if (dateRatio > 0.8) s.date += 9;
    else if (dateRatio > 0.5) s.date += 4;

    // Numeric analysis
    const numericVals = vals
      .map(v => parseFloat(String(v).replace(/[^\d.-]/g, '')))
      .filter(v => !isNaN(v) && v >= 0);
    const numericRatio = numericVals.length / vals.length;

    if (numericRatio > 0.8) {
      const avg = numericVals.reduce((a, b) => a + b, 0) / numericVals.length;
      const allInt = numericVals.every(v => Number.isInteger(v));
      const max = Math.max(...numericVals);

      // Quantity: integers, typically small-ish
      if (allInt && avg < 50_000 && avg >= 1) s.quantitySold += 7;
      if (allInt && max < 10_000)             s.quantitySold += 3;

      // Revenue: larger values, may be decimal
      if (avg > 500)  s.revenue += 5;
      if (avg > 5000) s.revenue += 4;
      if (!allInt)    s.revenue += 3;
    }

    // Text / cardinality analysis
    const textVals = vals.filter(v => typeof v === 'string' && isNaN(Number(v)) && String(v).trim().length > 1);
    const textRatio = textVals.length / vals.length;

    if (textRatio > 0.7) {
      const uniqueCount = new Set(vals.map(String)).size;
      const uniqueRatio = uniqueCount / vals.length;

      // Product: some repetition, meaningful text length
      if (uniqueRatio < 0.7 && uniqueRatio > 0.01) s.productName += 6;
      if (uniqueCount <= 200 && uniqueRatio < 0.5)  s.productName += 3;

      // Category: very few unique values
      if (uniqueCount <= 20 && uniqueRatio < 0.2)   s.category += 8;
      if (uniqueCount <= 8)                          s.category += 4;
    }
  });

  // Assign best column for each field greedily (highest score wins, no reuse)
  const used = new Set<string>();
  const mapping: Partial<Record<FieldKey, string>> = {};
  const confidence: Partial<Record<FieldKey, number>> = {};

  // Required fields first, then optional
  const fieldOrder: FieldKey[] = ['date', 'productName', 'revenue', 'quantitySold', 'category'];

  for (const field of fieldOrder) {
    let bestCol = '';
    let bestScore = 0;

    headers.forEach(h => {
      if (used.has(h)) return;
      if (score[h][field] > bestScore) {
        bestScore = score[h][field];
        bestCol = h;
      }
    });

    if (bestCol && bestScore > 0) {
      mapping[field] = bestCol;
      // Normalise to 0–1: max possible name score = 10, max content = ~9+7 = 16
      confidence[field] = Math.min(1, bestScore / 16);
      used.add(bestCol);
    }
  }

  return { mapping, confidence };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function normalizeDate(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    return ''; // not a valid Excel serial date
  }
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? '' : value.toISOString().split('T')[0];
  }
  const str = String(value).trim();
  if (str.length < 4) return '';
  const parsed = new Date(str);
  // Return empty string instead of the raw string — prevents crash in forecast engine
  return isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
}

// What fraction of a column's values look like real dates?
function dateValidityRatio(rows: any[], col: string): number {
  if (!col || rows.length === 0) return 0;
  const sample = rows.slice(0, 30);
  const valid = sample.filter(r => normalizeDate(r[col]) !== '').length;
  return valid / sample.length;
}

function fileNameToDatasetName(name: string): string {
  return name
    .replace(/\.(csv|xlsx|xls)$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function confidenceColor(c: number): string {
  if (c >= 0.7) return 'text-teal-400';
  if (c >= LOW_CONFIDENCE) return 'text-amber-400';
  return 'text-red-400';
}

function confidenceLabel(c: number): string {
  if (c >= 0.7) return 'Auto-detected';
  if (c >= LOW_CONFIDENCE) return 'Likely';
  return 'Needs check';
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function DataUpload() {
  const [, setLocation] = useLocation();
  const [datasetName, setDatasetName] = useState('');
  const [fileName, setFileName] = useState('');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [overrides, setOverrides] = useState<Partial<Record<FieldKey, string>>>({});
  const [error, setError] = useState('');
  const [step, setStep] = useState<'idle' | 'ready' | 'uploading' | 'forecasting' | 'done'>('idle');

  const uploadMutation = trpc.data.upload.useMutation();
  const forecastMutation = trpc.forecast.run.useMutation();

  const effectiveMapping = (key: FieldKey): string =>
    overrides[key] ?? detection?.mapping[key] ?? '';

  const effectiveConfidence = (key: FieldKey): number =>
    overrides[key] !== undefined ? 1 : (detection?.confidence[key] ?? 0);

  const allHeaders = rawRows.length > 0 ? Object.keys(rawRows[0] as Record<string, any>) : [];

  const processRows = (rows: any[], name: string) => {
    if (rows.length === 0) { setError('File is empty'); return; }
    setRawRows(rows);
    const headers = Object.keys(rows[0] as Record<string, any>);
    const det = detectColumns(headers, rows);
    setDetection(det);
    setOverrides({});
    if (!datasetName) setDatasetName(name);
    setStep('ready');
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    setRawRows([]);
    setDetection(null);
    setStep('idle');

    const prettyName = fileNameToDatasetName(file.name);

    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array', cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          processRows(XLSX.utils.sheet_to_json(ws, { defval: '' }), prettyName);
        } catch {
          setError('Could not read this Excel file. Try saving it as .xlsx and re-uploading.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (r) => processRows(r.data, prettyName),
        error: (err) => setError(`Could not read CSV: ${err.message}`),
      });
    }
  };

  const handleRun = async () => {
    if (!datasetName.trim()) { setError('Give this dataset a name so you can find it later'); return; }

    const dc = effectiveMapping('date');
    const pc = effectiveMapping('productName');
    const qc = effectiveMapping('quantitySold');
    const rc = effectiveMapping('revenue');
    const cc = effectiveMapping('category');

    if (!dc || !pc || !qc || !rc) {
      setError('Some required columns could not be detected. Use the dropdowns below to correct them.');
      return;
    }

    setError('');
    setStep('uploading');

    try {
      const records: SalesRecord[] = rawRows
        .map(row => ({
          date: normalizeDate(row[dc]),
          productName: String(row[pc] ?? '').trim(),
          category: cc ? String(row[cc] ?? '').trim() || undefined : undefined,
          quantitySold: parseFloat(String(row[qc]).replace(/[^\d.-]/g, '')) || 0,
          revenue: parseFloat(String(row[rc]).replace(/[^\d.-]/g, '')) || 0,
        }))
        .filter(r => r.date && r.productName && r.quantitySold > 0);

      if (records.length === 0) {
        setError('No usable rows found after processing. Check the corrections below and try again.');
        setStep('ready');
        return;
      }

      const uploadResult = await uploadMutation.mutateAsync({ datasetName, records });

      setStep('forecasting');
      const forecastResult = await forecastMutation.mutateAsync({
        datasetId: uploadResult.datasetId,
        horizon: 30,
      });

      setStep('done');
      setTimeout(() => setLocation(`/forecast?id=${forecastResult.forecastId}`), 700);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStep('ready');
    }
  };

  const isBusy = step === 'uploading' || step === 'forecasting';
  const isDone = step === 'done';

  // Which required fields still have no mapping at all?
  const missingRequired = FIELDS.filter(
    f => f.required && !effectiveMapping(f.key)
  );

  // Which fields have low confidence and need a correction dropdown?
  const needsCorrection = FIELDS.filter(
    f => effectiveConfidence(f.key) < LOW_CONFIDENCE && effectiveMapping(f.key)
  );

  // Check if the mapped date column actually contains real dates
  const dateMappedCol = effectiveMapping('date');
  const dateValidity = step === 'ready' && dateMappedCol
    ? dateValidityRatio(rawRows, dateMappedCol)
    : 1;
  const dateColumnLooksWrong = step === 'ready' && dateMappedCol && dateValidity < 0.4;
  const noDateColumnFound = step === 'ready' && !dateMappedCol;

  return (
    <div className="bg-transparent p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">Upload Sales Data</h1>
          <p className="text-lg text-slate-400">
            Drop your file — we'll figure out the columns automatically.
          </p>
        </div>

        <div className="space-y-6">

          {/* ── Step 1: Dataset name ────────────────────────────────────────── */}
          <Card className="p-6 bg-white/[0.03] border-white/[0.06]">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Dataset Name
            </label>
            <Input
              placeholder="e.g., April Sales 2024"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              disabled={isBusy}
              className="bg-white/[0.04] border-white/[0.10] text-slate-200 placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-2">Auto-filled from filename — feel free to rename.</p>
          </Card>

          {/* ── Step 2: Drop zone ───────────────────────────────────────────── */}
          <Card
            className={`p-10 border-2 border-dashed transition-colors bg-white/[0.02] cursor-pointer
              ${step === 'ready' ? 'border-teal-500/40' : 'border-white/[0.10] hover:border-amber-400/40'}`}
            onClick={() => !isBusy && document.getElementById('file-upload')?.click()}
          >
            <div className="text-center space-y-4">
              {step === 'ready' ? (
                <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
              ) : (
                <Upload className="w-12 h-12 text-slate-400 mx-auto" />
              )}

              <div>
                <p className="font-display font-bold text-xl text-slate-200 mb-1">
                  {fileName || 'Click or drag a file here'}
                </p>
                <p className="text-sm text-slate-400">
                  {step === 'ready'
                    ? `${rawRows.length.toLocaleString()} rows loaded · Click to change file`
                    : 'Supports CSV, Excel (.xlsx, .xls)'}
                </p>
              </div>

              {step !== 'ready' && (
                <Button
                  variant="secondary"
                  onClick={(e) => { e.stopPropagation(); document.getElementById('file-upload')?.click(); }}
                  disabled={isBusy}
                  className="bg-white/[0.06] border-white/[0.12] text-slate-200 hover:bg-white/[0.10]"
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  Select File
                </Button>
              )}

              <input
                type="file"
                id="file-upload"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
                disabled={isBusy}
              />
            </div>
          </Card>

          {/* ── Step 3: Detection summary ───────────────────────────────────── */}
          {step === 'ready' && detection && (
            <Card className="p-6 bg-white/[0.03] border-white/[0.06] space-y-5">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-200 mb-1">
                  Column Detection
                </h3>
                <p className="text-sm text-slate-400">
                  We analysed your data and mapped these columns. Correct any that look wrong.
                </p>
              </div>

              {/* Field rows */}
              <div className="space-y-3">
                {FIELDS.map(({ key, label, Icon, required }) => {
                  const col = effectiveMapping(key);
                  const conf = effectiveConfidence(key);
                  const showDropdown = conf < LOW_CONFIDENCE || !col;

                  return (
                    <div key={key} className="flex items-center gap-4">
                      {/* Icon + label */}
                      <div className="flex items-center gap-2 w-40 shrink-0">
                        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-300">
                          {label}
                          {required && <span className="text-amber-400 ml-0.5">*</span>}
                        </span>
                      </div>

                      {/* Detected column pill or dropdown */}
                      {!showDropdown ? (
                        <div className="flex items-center gap-3 flex-1">
                          <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.10] text-sm font-mono text-slate-200">
                            {col}
                          </span>
                          <span className={`text-xs ${confidenceColor(conf)}`}>
                            {confidenceLabel(conf)}
                          </span>
                          {/* Always allow override */}
                          <button
                            className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2 ml-auto"
                            onClick={() => setOverrides(prev => ({ ...prev, [key]: '' }))}
                          >
                            change
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="relative flex-1">
                            <select
                              value={overrides[key] ?? col ?? ''}
                              onChange={(e) => setOverrides(prev => ({ ...prev, [key]: e.target.value }))}
                              disabled={isBusy}
                              className="w-full appearance-none px-3 py-2 pr-8 border border-amber-400/40 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-amber-400/70"
                              style={{ backgroundColor: '#1a1d27' }}
                            >
                              <option value="" style={{ backgroundColor: '#1a1d27', color: '#94a3b8' }}>
                                {required ? '— select a column —' : '— none (optional) —'}
                              </option>
                              {allHeaders.map(h => (
                                <option key={h} value={h} style={{ backgroundColor: '#1a1d27', color: '#e2e8f0' }}>{h}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                          {!col && required && (
                            <span className="text-xs text-red-400 shrink-0">not found</span>
                          )}
                          {col && !overrides[key] && (
                            <span className="text-xs text-amber-400 shrink-0">needs check</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Data preview */}
              {effectiveMapping('date') && effectiveMapping('productName') && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Preview — first 5 rows as we'll read them:</p>
                  <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                    <table className="w-full text-xs font-mono">
                      <thead className="bg-white/[0.04]">
                        <tr>
                          {(['date', 'productName', 'quantitySold', 'revenue'] as FieldKey[]).map(f => (
                            <th key={f} className="px-3 py-2 text-left text-amber-400 font-medium whitespace-nowrap">
                              {FIELDS.find(x => x.key === f)?.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawRows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t border-white/[0.04] text-slate-300">
                            <td className="px-3 py-2 whitespace-nowrap">
                              {effectiveMapping('date') ? normalizeDate(row[effectiveMapping('date')]) : '—'}
                            </td>
                            <td className="px-3 py-2 max-w-[140px] truncate">
                              {effectiveMapping('productName') ? String(row[effectiveMapping('productName')] ?? '—') : '—'}
                            </td>
                            <td className="px-3 py-2">
                              {effectiveMapping('quantitySold') ? String(row[effectiveMapping('quantitySold')] ?? '—') : '—'}
                            </td>
                            <td className="px-3 py-2">
                              {effectiveMapping('revenue') ? String(row[effectiveMapping('revenue')] ?? '—') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Wrong file type warning — no date column found */}
              {(noDateColumnFound || dateColumnLooksWrong) && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-red-300">
                    ⚠️ This file doesn't look like time-series sales data
                  </p>
                  <p className="text-xs text-red-300/80 leading-relaxed">
                    {noDateColumnFound
                      ? "No date column was found. Sales forecasting needs a date column with values like 2024-01-15."
                      : `The column mapped to "Date" ("${dateMappedCol}") contains mostly non-date values. Try selecting a different column.`}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Your file needs at least: a <strong className="text-slate-300">Date</strong> column (when the sale happened),
                    a <strong className="text-slate-300">Product</strong> column, a <strong className="text-slate-300">Quantity</strong> column,
                    and a <strong className="text-slate-300">Revenue</strong> column.
                    Product catalogs and inventory lists won't work here.
                  </p>
                </div>
              )}

              {/* Missing required fields warning */}
              {missingRequired.length > 0 && !noDateColumnFound && !dateColumnLooksWrong && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-300">
                  Still missing: {missingRequired.map(f => f.label).join(', ')}. Use the dropdowns above to select them.
                </div>
              )}
            </Card>
          )}

          {/* ── Error ───────────────────────────────────────────────────────── */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* ── CTA ─────────────────────────────────────────────────────────── */}
          {step !== 'idle' && (
            <Button
              size="lg"
              onClick={handleRun}
              disabled={isBusy || isDone || missingRequired.length > 0 || noDateColumnFound || dateColumnLooksWrong}
              className="w-full bg-amber-400 text-slate-950 font-semibold hover:bg-amber-300 disabled:opacity-60 h-14 text-base"
            >
              {step === 'uploading'   && <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving {rawRows.length.toLocaleString()} records…</>}
              {step === 'forecasting' && <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Running 30-day ML forecast…</>}
              {step === 'done'        && <><CheckCircle2 className="w-5 h-5 mr-2" />Done! Taking you to results…</>}
              {step === 'ready'       && `Analyse & Generate Forecast →`}
            </Button>
          )}

          {/* ── Help strip ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { emoji: '📅', title: 'Any date format', desc: 'YYYY-MM-DD, DD/MM/YYYY, Jan 1 2024 — all work' },
              { emoji: '📊', title: 'CSV or Excel',    desc: '.csv, .xlsx, and .xls files supported' },
              { emoji: '🤖', title: 'ML forecast',     desc: 'Linear regression + seasonality, no API needed' },
            ].map(({ emoji, title, desc }) => (
              <Card key={title} className="p-4 bg-white/[0.02] border-white/[0.06] text-center">
                <p className="text-2xl mb-2">{emoji}</p>
                <p className="text-sm font-semibold text-slate-200 mb-1">{title}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
