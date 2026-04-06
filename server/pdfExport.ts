import jsPDF from 'jspdf';
import { storagePut } from './storage';

export interface ReportData {
  title: string;
  generatedAt: Date;
  summary: string;
  forecasts: Array<{
    productName: string;
    currentAvg: number;
    forecastedAvg: number;
    changePercent: number;
  }>;
  insights: string[];
  recommendations: string[];
}

/**
 * Generate PDF report from forecast data
 */
export async function generatePDFReport(data: ReportData, userId: string): Promise<{ url: string; key: string }> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add text with wrapping
    const addWrappedText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' = 'normal', maxWidth = contentWidth) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * (fontSize / 2.5) + 2;
      return lines.length;
    };

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, margin, yPosition);
    yPosition += 15;

    // Generated date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${data.generatedAt.toLocaleDateString()} ${data.generatedAt.toLocaleTimeString()}`, margin, yPosition);
    yPosition += 10;

    // Summary
    addWrappedText('Executive Summary', 14, 'bold');
    addWrappedText(data.summary, 11);
    yPosition += 5;

    // Product Forecasts Table
    addWrappedText('Product Forecasts', 14, 'bold');
    yPosition += 3;

    // Table header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Product', margin, yPosition);
    doc.text('Current Avg', margin + 60, yPosition);
    doc.text('Forecast Avg', margin + 110, yPosition);
    doc.text('Change %', margin + 160, yPosition);
    yPosition += 8;

    // Table rows
    doc.setFont('helvetica', 'normal');
    data.forecasts.forEach(forecast => {
      if (yPosition > pageHeight - margin - 20) {
        doc.addPage();
        yPosition = margin;
      }

      doc.text(forecast.productName.substring(0, 20), margin, yPosition);
      doc.text(forecast.currentAvg.toString(), margin + 60, yPosition);
      doc.text(forecast.forecastedAvg.toString(), margin + 110, yPosition);
      doc.text(`${forecast.changePercent > 0 ? '+' : ''}${forecast.changePercent}%`, margin + 160, yPosition);
      yPosition += 8;
    });

    yPosition += 5;

    // Insights
    if (data.insights.length > 0) {
      addWrappedText('Key Insights', 14, 'bold');
      data.insights.forEach(insight => {
        if (yPosition > pageHeight - margin - 20) {
          doc.addPage();
          yPosition = margin;
        }
        addWrappedText(`• ${insight}`, 10);
      });
      yPosition += 5;
    }

    // Recommendations
    if (data.recommendations.length > 0) {
      addWrappedText('Recommendations', 14, 'bold');
      data.recommendations.forEach(rec => {
        if (yPosition > pageHeight - margin - 20) {
          doc.addPage();
          yPosition = margin;
        }
        addWrappedText(`• ${rec}`, 10);
      });
    }

    // Convert to bytes
    const pdfBytes = doc.output('arraybuffer');
    const buffer = Buffer.from(pdfBytes);

    // Upload to S3
    const fileName = `forecast-${Date.now()}.pdf`;
    const key = `${userId}/reports/${fileName}`;

    const result = await storagePut(key, buffer, 'application/pdf');

    return result;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generate CSV export from forecast data
 */
export async function generateCSVExport(data: ReportData, userId: string): Promise<{ url: string; key: string }> {
  try {
    // CSV header
    const headers = ['Product Name', 'Current Average', 'Forecasted Average', 'Change %'];
    const rows = data.forecasts.map(f => [
      f.productName,
      f.currentAvg.toString(),
      f.forecastedAvg.toString(),
      `${f.changePercent > 0 ? '+' : ''}${f.changePercent}%`
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Add insights and recommendations
    const csvWithInsights = [
      csvContent,
      '',
      'Insights',
      ...data.insights.map(i => `"${i}"`),
      '',
      'Recommendations',
      ...data.recommendations.map(r => `"${r}"`)
    ].join('\n');

    const buffer = Buffer.from(csvWithInsights, 'utf-8');

    // Upload to S3
    const fileName = `forecast-${Date.now()}.csv`;
    const key = `${userId}/reports/${fileName}`;

    const result = await storagePut(key, buffer, 'text/csv');

    return result;
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw error;
  }
}
