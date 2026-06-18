import { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Archive,
  ArrowLeft
} from 'lucide-react';
import type { ValidationSummary } from '../types';

interface DashboardProps {
  summary: ValidationSummary;
  onReset: () => void;
}

export default function Dashboard({ summary, onReset }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'errors' | 'valid'>('errors');

  const handleDownload = (fileType: string) => {
    if (fileType === 'zip' && summary.zipBase64) {
      const link = document.createElement('a');
      link.href = `data:application/zip;base64,${summary.zipBase64}`;
      link.download = 'transaction_validation_package.zip';
      link.click();
      return;
    }
    
    if (fileType === 'cleaned' && summary.cleanedCsvContent) {
      const blob = new Blob([summary.cleanedCsvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'cleaned_validated_output.csv';
      link.click();
      return;
    }

    if (fileType === 'errors' && summary.errorsCsvContent) {
      const blob = new Blob([summary.errorsCsvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'validation_errors.csv';
      link.click();
      return;
    }

    alert('Client-side processing error: File data missing from memory payload.');
  };

  const columns = [
    'rowNumber', 'order_id', 'customer_name', 'customer_phone', 'country_code', 
    'order_date', 'order_time', 'product_id', 'product_name', 'quantity', 
    'unit_price', 'total_amount', 'payment_mode', 'currency', 'transaction_id', 'payment_status'
  ];

  return (
    <div className="w-full space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-4xl font-heading font-medium text-[var(--text-charcoal)]">Validation Results</h2>
          <p className="text-sm text-[var(--text-muted)] mt-2">Review the processed data and export your chunks.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onReset}
            className="editorial-button-outline px-6 py-2.5 text-sm inline-flex items-center"
          >
            <ArrowLeft size={16} className="mr-2" /> Start Over
          </button>
          <button 
            onClick={() => handleDownload('zip')}
            className="editorial-button px-6 py-2.5 text-sm inline-flex items-center"
          >
            <Archive size={16} className="mr-2" /> Download ZIP
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="editorial-panel p-8 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-6">
            <p className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-widest">Total Rows</p>
            <Database size={20} className="text-[var(--accent-sand)]" />
          </div>
          <h3 className="text-5xl font-heading font-medium text-[var(--text-charcoal)]">{summary.totalRows}</h3>
        </div>

        <div className="editorial-panel p-8 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-6">
            <p className="text-[10px] font-bold text-[var(--accent-sage)] uppercase tracking-widest">Valid Rows</p>
            <CheckCircle2 size={20} className="text-[var(--accent-sage)]" />
          </div>
          <h3 className="text-5xl font-heading font-medium text-[var(--accent-sage)]">{summary.validRowsCount}</h3>
        </div>

        <div className="editorial-panel p-8 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-6">
            <p className="text-[10px] font-bold text-[var(--accent-terra)] uppercase tracking-widest">Invalid Rows</p>
            <XCircle size={20} className="text-[var(--accent-terra)]" />
          </div>
          <h3 className="text-5xl font-heading font-medium text-[var(--accent-terra)]">{summary.invalidRowsCount}</h3>
        </div>

        <div className="editorial-panel p-8 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-6">
            <p className="text-[10px] font-bold text-[var(--accent-sand)] uppercase tracking-widest">Duplicates</p>
            <AlertTriangle size={20} className="text-[var(--accent-sand)]" />
          </div>
          <h3 className="text-5xl font-heading font-medium text-[var(--text-charcoal)]">{summary.duplicateRowsCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Error Distribution */}
        <div className="editorial-panel lg:col-span-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-[var(--border-soft)] bg-[var(--bg-cream)]/50">
            <h3 className="text-base font-heading font-medium text-[var(--text-charcoal)]">Error Distribution</h3>
          </div>
          <div className="p-6 flex-1 overflow-y-auto max-h-[320px]">
            {Object.keys(summary.errorsByField).length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-[var(--text-subtle)] text-sm">No errors found.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {Object.entries(summary.errorsByField)
                  .sort((a, b) => b[1] - a[1])
                  .map(([field, count]) => (
                  <li key={field} className="flex justify-between items-center text-sm group">
                    <span className="font-mono text-[var(--text-muted)] bg-[var(--bg-cream-darker)] border border-[var(--border-soft-hover)] px-3 py-1.5 rounded-md text-xs">{field}</span>
                    <span className="text-[var(--accent-terra)] text-xs font-bold bg-[var(--accent-terra-light)] px-2.5 py-1 rounded-md border border-[var(--border-soft-hover)]">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="editorial-panel lg:col-span-2 overflow-hidden">
           <div className="p-6 border-b border-[var(--border-soft)] bg-[var(--bg-cream)]/50">
            <h3 className="text-base font-heading font-medium text-[var(--text-charcoal)]">Exports</h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button 
              onClick={() => handleDownload('cleaned')}
              disabled={summary.validRowsCount === 0}
              className={`p-6 rounded-2xl flex items-start text-left transition-all duration-300 border ${
                summary.validRowsCount === 0 
                  ? 'bg-[var(--bg-cream)] border-transparent text-[var(--text-subtle)] cursor-not-allowed' 
                  : 'bg-white border-[var(--accent-sage-light)] hover:border-[var(--accent-sage)] hover:shadow-[0_4px_20px_rgba(74,103,85,0.08)] group'
              }`}
            >
              <div className={`p-3 rounded-full mt-0.5 mr-4 ${summary.validRowsCount === 0 ? 'bg-[var(--bg-cream-darker)] text-[var(--text-subtle)]' : 'bg-[var(--accent-sage-light)] text-[var(--accent-sage)] group-hover:bg-[var(--accent-sage)] group-hover:text-white transition-colors'}`}>
                <CheckCircle2 size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className={`text-base font-medium ${summary.validRowsCount === 0 ? 'text-[var(--text-subtle)]' : 'text-[var(--text-charcoal)]'}`}>Cleaned Dataset</h4>
                <p className="text-xs mt-2 text-[var(--text-muted)] leading-relaxed">Valid rows only. Pre-chunked ({summary.chunkCount}).</p>
              </div>
            </button>

            <button 
              onClick={() => handleDownload('errors')}
              disabled={summary.invalidRowsCount === 0}
              className={`p-6 rounded-2xl flex items-start text-left transition-all duration-300 border ${
                summary.invalidRowsCount === 0 
                  ? 'bg-[var(--bg-cream)] border-transparent text-[var(--text-subtle)] cursor-not-allowed' 
                  : 'bg-white border-[var(--accent-terra-light)] hover:border-[var(--accent-terra)] hover:shadow-[0_4px_20px_rgba(194,109,92,0.08)] group'
              }`}
            >
              <div className={`p-3 rounded-full mt-0.5 mr-4 ${summary.invalidRowsCount === 0 ? 'bg-[var(--bg-cream-darker)] text-[var(--text-subtle)]' : 'bg-[var(--accent-terra-light)] text-[var(--accent-terra)] group-hover:bg-[var(--accent-terra)] group-hover:text-white transition-colors'}`}>
                <XCircle size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className={`text-base font-medium ${summary.invalidRowsCount === 0 ? 'text-[var(--text-subtle)]' : 'text-[var(--text-charcoal)]'}`}>Error Log</h4>
                <p className="text-xs mt-2 text-[var(--text-muted)] leading-relaxed">Invalid rows appended with error reasons.</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Data Previews */}
      <div className="editorial-panel overflow-hidden flex flex-col">
        <div className="flex border-b border-[var(--border-soft)] bg-[var(--bg-cream)]">
          <button 
            onClick={() => setActiveTab('errors')}
            className={`px-8 py-5 text-sm font-medium transition-colors duration-300 border-b-[2px] ${
              activeTab === 'errors' ? 'border-[var(--text-charcoal)] text-[var(--text-charcoal)] bg-white' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-charcoal)] hover:bg-white'
            }`}
          >
            Issues <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] ${activeTab === 'errors' ? 'bg-[var(--bg-cream-darker)] text-[var(--text-charcoal)]' : 'bg-[var(--border-soft-hover)]'}`}>{Math.min(summary.invalidRowsCount, 100)}</span>
          </button>
          <button 
            onClick={() => setActiveTab('valid')}
            className={`px-8 py-5 text-sm font-medium transition-colors duration-300 border-b-[2px] ${
              activeTab === 'valid' ? 'border-[var(--text-charcoal)] text-[var(--text-charcoal)] bg-white' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-charcoal)] hover:bg-white'
            }`}
          >
            Clean Data <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] ${activeTab === 'valid' ? 'bg-[var(--bg-cream-darker)] text-[var(--text-charcoal)]' : 'bg-[var(--border-soft-hover)]'}`}>{Math.min(summary.validRowsCount, 100)}</span>
          </button>
        </div>

        <div className="overflow-x-auto bg-white max-h-[600px]">
          {activeTab === 'errors' ? (
            summary.invalidRowsPreview.length === 0 ? (
              <div className="p-16 text-center text-sm text-[var(--text-subtle)]">No issues detected in the dataset.</div>
            ) : (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-[var(--bg-cream)] text-[var(--text-muted)] border-b border-[var(--border-soft)] sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-widest uppercase text-[10px]">Row</th>
                    <th className="px-6 py-4 font-semibold tracking-widest uppercase text-[10px] min-w-[300px]">Error Reasons</th>
                    {columns.filter(c => c !== 'rowNumber').map(col => (
                      <th key={col} className="px-6 py-4 font-semibold tracking-widest uppercase text-[10px]">{col.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {summary.invalidRowsPreview.map((item, i) => (
                    <tr key={i} className="hover:bg-[var(--bg-cream)] transition-colors">
                      <td className="px-6 py-4 font-mono text-[var(--text-muted)] align-top">{item.rowNumber}</td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          {item.errors.map((err, idx) => (
                            <span key={idx} className="text-[11px] bg-[var(--accent-terra-light)] text-[var(--accent-terra)] px-3 py-1.5 rounded-md border border-[var(--border-soft-hover)] inline-block w-fit">
                              <span className="font-bold">{err.field}:</span> {err.reason}
                            </span>
                          ))}
                        </div>
                      </td>
                      {columns.filter(c => c !== 'rowNumber').map(col => {
                        const hasError = item.errors.some(e => e.field === col);
                        const dataVal = item.data[col] || item.data[Object.keys(item.data).find(k => k.trim().toLowerCase().replace(/^\uFEFF/, '') === col.toLowerCase()) || ''] || '-';
                        return (
                          <td key={col} className={`px-6 py-4 align-top font-mono ${hasError ? 'bg-[var(--accent-terra-light)]/50 text-[var(--accent-terra)] font-medium' : 'text-[var(--text-muted)]'}`}>
                            {dataVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            summary.validRowsPreview.length === 0 ? (
              <div className="p-16 text-center text-sm text-[var(--text-subtle)]">No clean rows available to display.</div>
            ) : (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-[var(--bg-cream)] text-[var(--text-muted)] border-b border-[var(--border-soft)] sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-widest uppercase text-[10px]">Row</th>
                    {columns.filter(c => c !== 'rowNumber').map(col => (
                      <th key={col} className="px-6 py-4 font-semibold tracking-widest uppercase text-[10px]">{col.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {summary.validRowsPreview.map((item, i) => (
                    <tr key={i} className="hover:bg-[var(--bg-cream)] transition-colors">
                      <td className="px-6 py-4 font-mono text-[var(--text-subtle)]">{item.rowNumber}</td>
                      {columns.filter(c => c !== 'rowNumber').map(col => {
                        const dataVal = item.data[col] || item.data[Object.keys(item.data).find(k => k.trim().toLowerCase().replace(/^\uFEFF/, '') === col.toLowerCase()) || ''] || '-';
                        return (
                          <td key={col} className="px-6 py-4 font-mono text-[var(--text-muted)]">{dataVal}</td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}
