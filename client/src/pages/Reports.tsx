import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Share2, Trash2, Eye } from 'lucide-react';

interface Report {
  id: number;
  name: string;
  forecastDate: string;
  generatedAt: string;
  accuracy: number;
  pdfUrl?: string;
  csvUrl?: string;
}

const mockReports: Report[] = [
  {
    id: 1,
    name: 'Q1 Sales Forecast',
    forecastDate: '2026-04-05',
    generatedAt: '2026-04-06',
    accuracy: 92,
    pdfUrl: '#',
    csvUrl: '#',
  },
  {
    id: 2,
    name: 'March Sales Analysis',
    forecastDate: '2026-04-03',
    generatedAt: '2026-04-04',
    accuracy: 88,
    pdfUrl: '#',
    csvUrl: '#',
  },
  {
    id: 3,
    name: 'February Forecast',
    forecastDate: '2026-04-01',
    generatedAt: '2026-04-02',
    accuracy: 85,
    pdfUrl: '#',
    csvUrl: '#',
  },
  {
    id: 4,
    name: 'January Summary',
    forecastDate: '2026-03-28',
    generatedAt: '2026-03-29',
    accuracy: 89,
    pdfUrl: '#',
    csvUrl: '#',
  },
];

export default function Reports() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const handleDelete = (id: number) => {
    setReports(reports.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">Reports</h1>
            <p className="text-lg text-muted-foreground font-serif">
              Download and manage your forecast reports
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          {['All', 'This Month', 'Last 3 Months', 'This Year'].map(filter => (
            <Button key={filter} variant="outline" size="sm">
              {filter}
            </Button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {reports.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-lg text-muted-foreground font-serif mb-4">
                No reports yet. Generate your first forecast to create a report.
              </p>
              <Button variant="primary">
                Create Forecast
              </Button>
            </Card>
          ) : (
            reports.map(report => (
              <Card
                key={report.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-serif font-bold mb-2">{report.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Forecast Date</p>
                        <p className="font-medium">{report.forecastDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Generated</p>
                        <p className="font-medium">{report.generatedAt}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Accuracy</p>
                        <p className="font-medium text-accent">{report.accuracy}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant="secondary" className="mt-1">Completed</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <Button variant="ghost" size="sm" title="View">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Download PDF" asChild>
                      <a href={report.pdfUrl} download>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" title="Share">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(report.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Report Details Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border/50 flex items-center justify-between sticky top-0 bg-card">
                <h2 className="text-2xl font-serif font-bold">{selectedReport.name}</h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedReport(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Forecast Date</p>
                    <p className="font-serif font-bold">{selectedReport.forecastDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Generated</p>
                    <p className="font-serif font-bold">{selectedReport.generatedAt}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                    <p className="font-serif font-bold text-accent">{selectedReport.accuracy}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge variant="secondary">Completed</Badge>
                  </div>
                </div>

                {/* Key Findings */}
                <div>
                  <h3 className="font-serif font-bold text-lg mb-3">Key Findings</h3>
                  <ul className="space-y-2 text-sm text-foreground/80 font-serif">
                    <li>• Overall demand is trending upward with consistent growth</li>
                    <li>• Widget A shows the strongest performance with 15% growth</li>
                    <li>• Seasonal patterns detected with weekend peaks</li>
                    <li>• Recommended inventory increase for top performers</li>
                  </ul>
                </div>

                {/* Download Options */}
                <div className="border-t border-border/50 pt-6">
                  <h3 className="font-serif font-bold text-lg mb-4">Download Report</h3>
                  <div className="flex gap-3">
                    <Button variant="primary" asChild>
                      <a href={selectedReport.pdfUrl} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={selectedReport.csvUrl} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download CSV
                      </a>
                    </Button>
                    <Button variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Report
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
