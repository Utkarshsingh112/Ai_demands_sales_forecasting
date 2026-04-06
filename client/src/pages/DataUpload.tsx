import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, FileUp, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface SalesRecord {
  date: string;
  productName: string;
  category?: string;
  quantitySold: number;
  revenue: number;
}

export default function DataUpload() {
  const [datasetName, setDatasetName] = useState('');
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setError('CSV file is empty');
          return;
        }
        setCsvData(results.data);
        // Auto-detect columns
        const firstRow = results.data[0] as Record<string, any>;
        const headers = Object.keys(firstRow);
        const mapping: Record<string, string> = {};
        
        headers.forEach(header => {
          const lower = header.toLowerCase();
          if (lower.includes('date')) mapping['date'] = header;
          else if (lower.includes('product')) mapping['productName'] = header;
          else if (lower.includes('category')) mapping['category'] = header;
          else if (lower.includes('quantity') || lower.includes('qty')) mapping['quantitySold'] = header;
          else if (lower.includes('revenue') || lower.includes('sales')) mapping['revenue'] = header;
        });
        
        setColumnMapping(mapping);
      },
      error: (error) => {
        setError(`CSV parsing error: ${error.message}`);
      }
    });
  };

  const handleColumnMappingChange = (field: string, csvColumn: string) => {
    setColumnMapping(prev => ({ ...prev, [field]: csvColumn }));
  };

  const handleUpload = async () => {
    if (!datasetName.trim()) {
      setError('Please enter a dataset name');
      return;
    }

    if (csvData.length === 0) {
      setError('Please select a CSV file');
      return;
    }

    if (!columnMapping.date || !columnMapping.productName || !columnMapping.quantitySold || !columnMapping.revenue) {
      setError('Please map all required columns');
      return;
    }

    setIsLoading(true);

    try {
      const mappedRecords: SalesRecord[] = csvData.map(row => ({
        date: row[columnMapping.date],
        productName: row[columnMapping.productName],
        category: columnMapping.category ? row[columnMapping.category] : undefined,
        quantitySold: parseFloat(row[columnMapping.quantitySold]),
        revenue: parseFloat(row[columnMapping.revenue]),
      }));

      setRecords(mappedRecords);
      // TODO: Call data.upload tRPC mutation
      setError('');
    } catch (err) {
      setError('Failed to process CSV data');
    } finally {
      setIsLoading(false);
    }
  };

  const csvColumns = csvData.length > 0 ? Object.keys(csvData[0] as Record<string, any>) : [];
  const requiredFields = ['date', 'productName', 'quantitySold', 'revenue'];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Upload Sales Data</h1>
          <p className="text-lg text-muted-foreground font-serif">
            Import your historical sales data to get started with forecasting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Upload Section */}
          <div className="md:col-span-2 space-y-6">
            {/* Dataset Name */}
            <Card className="p-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Dataset Name
              </label>
              <Input
                type="text"
                placeholder="e.g., Q1 Sales Data"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
              />
            </Card>

            {/* File Upload */}
            <Card className="p-8 border-2 border-dashed border-border/50 hover:border-accent/50 transition-colors">
              <div className="text-center space-y-4">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-serif font-bold text-lg mb-1">Upload CSV or Excel file</p>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop or click to select
                  </p>
                </div>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="secondary"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  Select File
                </Button>
              </div>
            </Card>

            {/* Column Mapping */}
            {csvColumns.length > 0 && (
              <Card className="p-6 space-y-4">
                <h3 className="font-serif font-bold text-lg">Map Your Columns</h3>
                <div className="space-y-3">
                  {requiredFields.map(field => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {field.replace(/([A-Z])/g, ' $1').trim()} *
                      </label>
                      <select
                        value={columnMapping[field] || ''}
                        onChange={(e) => handleColumnMappingChange(field, e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      >
                        <option value="">Select column...</option>
                        {csvColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  
                  {/* Optional: Category */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Category (optional)
                    </label>
                    <select
                      value={columnMapping.category || ''}
                      onChange={(e) => handleColumnMappingChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="">Select column...</option>
                      {csvColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Upload Button */}
            {csvColumns.length > 0 && (
              <Button
                variant="primary"
                size="lg"
                onClick={handleUpload}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Upload & Continue'}
              </Button>
            )}
          </div>

          {/* Right: Help Section */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-serif font-bold text-lg mb-4">Required Format</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-foreground mb-1">Date</p>
                  <p className="text-muted-foreground">YYYY-MM-DD format</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Product Name</p>
                  <p className="text-muted-foreground">Any text identifier</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Quantity Sold</p>
                  <p className="text-muted-foreground">Numeric value</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Revenue</p>
                  <p className="text-muted-foreground">Numeric value in currency</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-accent/5 border-accent/20">
              <h3 className="font-serif font-bold text-lg mb-4">Example Data</h3>
              <div className="text-xs font-mono space-y-1 text-muted-foreground">
                <p>date,product,qty,revenue</p>
                <p>2024-01-01,Widget A,100,5000</p>
                <p>2024-01-02,Widget B,150,7500</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
