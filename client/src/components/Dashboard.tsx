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
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div>
          <h2 className="text-3xl font-heading font-bold text-white tracking-wide">Validation Results</h2>
          <p className="text-sm text-slate-400 mt-1">Review the processed data and export your chunks.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onReset}
            className="neon-button-outline px-5 py-2.5 rounded-lg text-sm inline-flex items-center"
          >
            <ArrowLeft size={16} className="mr-2" /> Start Over
          </button>
          <button 
            onClick={() => handleDownload('zip')}
            className="neon-button px-5 py-2.5 rounded-lg text-sm inline-flex items-center"
          >
            <Archive size={16} className="mr-2" /> Download ZIP
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <div className="glass-panel p-6 rounded-2xl border-l-[3px] border-l-slate-400 overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-500/10 rounded-full blur-2xl group-hover:bg-slate-500/20 transition-all"></div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Total Rows</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-heading font-bold text-white leading-none">{summary.totalRows}</h3>
            <Database size={24} className="text-slate-500/50" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-l-[3px] border-l-emerald-400 overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3">Valid Rows</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-heading font-bold text-white leading-none drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">{summary.validRowsCount}</h3>
            <CheckCircle2 size={24} className="text-emerald-400/50" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-l-[3px] border-l-rose-500 overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
          <p className="text-[11px] font-bold text-rose-500 uppercase tracking-widest mb-3">Invalid Rows</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-heading font-bold text-white leading-none drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">{summary.invalidRowsCount}</h3>
            <XCircle size={24} className="text-rose-500/50" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-l-[3px] border-l-amber-500 overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest mb-3">Duplicates</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-heading font-bold text-white leading-none drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">{summary.duplicateRowsCount}</h3>
            <AlertTriangle size={24} className="text-amber-500/50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Error Distribution */}
        <div className="glass-panel rounded-2xl lg:col-span-1 flex flex-col">
          <div className="p-5 border-b border-white/5">
            <h3 className="text-sm font-heading font-semibold text-white tracking-wide">Error Distribution</h3>
          </div>
          <div className="p-5 flex-1 overflow-y-auto max-h-[300px]">
            {Object.keys(summary.errorsByField).length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-500 text-sm">No errors found.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {Object.entries(summary.errorsByField)
                  .sort((a, b) => b[1] - a[1])
                  .map(([field, count]) => (
                  <li key={field} className="flex justify-between items-center text-sm group">
                    <span className="font-mono text-cyan-100 bg-cyan-950/40 border border-cyan-800/50 px-2.5 py-1 rounded text-xs group-hover:bg-cyan-900/40 transition-colors">{field}</span>
                    <span className="text-rose-400 text-xs font-bold bg-rose-950/30 px-2 py-1 rounded border border-rose-900/30">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="glass-panel rounded-2xl lg:col-span-2">
           <div className="p-5 border-b border-white/5">
            <h3 className="text-sm font-heading font-semibold text-white tracking-wide">Exports</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <button 
              onClick={() => handleDownload('cleaned')}
              disabled={summary.validRowsCount === 0}
              className={`p-5 rounded-xl flex items-start text-left transition-all duration-300 border ${
                summary.validRowsCount === 0 
                  ? 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed' 
                  : 'bg-black/40 border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] group'
              }`}
            >
              <div className={`p-2 rounded-lg mt-0.5 mr-4 ${summary.validRowsCount === 0 ? 'bg-white/5 text-slate-500' : 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors'}`}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className={`text-sm font-bold tracking-wide ${summary.validRowsCount === 0 ? 'text-slate-500' : 'text-white'}`}>Cleaned Dataset</h4>
                <p className="text-[11px] mt-1.5 text-slate-400 leading-relaxed">Valid rows only. Pre-chunked ({summary.chunkCount}).</p>
              </div>
            </button>

            <button 
              onClick={() => handleDownload('errors')}
              disabled={summary.invalidRowsCount === 0}
              className={`p-5 rounded-xl flex items-start text-left transition-all duration-300 border ${
                summary.invalidRowsCount === 0 
                  ? 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed' 
                  : 'bg-black/40 border-white/10 hover:border-rose-500/30 hover:bg-rose-500/5 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)] group'
              }`}
            >
              <div className={`p-2 rounded-lg mt-0.5 mr-4 ${summary.invalidRowsCount === 0 ? 'bg-white/5 text-slate-500' : 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 group-hover:text-rose-300 transition-colors'}`}>
                <XCircle size={20} />
              </div>
              <div>
                <h4 className={`text-sm font-bold tracking-wide ${summary.invalidRowsCount === 0 ? 'text-slate-500' : 'text-white'}`}>Error Log</h4>
                <p className="text-[11px] mt-1.5 text-slate-400 leading-relaxed">Invalid rows appended with error reasons.</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Data Previews */}
      <div className="glass-panel rounded-2xl overflow-hidden flex flex-col relative z-10">
        <div className="flex border-b border-white/5 bg-black/40">
          <button 
            onClick={() => setActiveTab('errors')}
            className={`px-6 py-4 text-sm font-heading font-semibold transition-colors duration-300 border-b-[3px] ${
              activeTab === 'errors' ? 'border-cyan-400 text-white bg-white/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Issues <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'errors' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10'}`}>{Math.min(summary.invalidRowsCount, 100)}</span>
          </button>
          <button 
            onClick={() => setActiveTab('valid')}
            className={`px-6 py-4 text-sm font-heading font-semibold transition-colors duration-300 border-b-[3px] ${
              activeTab === 'valid' ? 'border-cyan-400 text-white bg-white/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Clean Data <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'valid' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10'}`}>{Math.min(summary.validRowsCount, 100)}</span>
          </button>
        </div>

        <div className="overflow-x-auto bg-transparent max-h-[500px]">
          {activeTab === 'errors' ? (
            summary.invalidRowsPreview.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">No issues detected in the dataset.</div>
            ) : (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-black/60 text-slate-300 border-b border-white/10 sticky top-0 shadow-sm z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-5 py-3 font-semibold tracking-wider uppercase text-[10px]">Row</th>
                    <th className="px-5 py-3 font-semibold tracking-wider uppercase text-[10px] min-w-[300px]">Error Reasons</th>
                    {columns.filter(c => c !== 'rowNumber').map(col => (
                      <th key={col} className="px-5 py-3 font-semibold tracking-wider uppercase text-[10px]">{col.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {summary.invalidRowsPreview.map((item, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-300 align-top">{item.rowNumber}</td>
                      <td className="px-5 py-3.5 align-top">
                        <div className="flex flex-col gap-2">
                          {item.errors.map((err, idx) => (
                            <span key={idx} className="text-[10.5px] bg-rose-950/40 text-rose-300 px-2.5 py-1 rounded-md border border-rose-900/50 inline-block w-fit">
                              <span className="font-bold text-rose-200">{err.field}:</span> {err.reason}
                            </span>
                          ))}
                        </div>
                      </td>
                      {columns.filter(c => c !== 'rowNumber').map(col => {
                        const hasError = item.errors.some(e => e.field === col);
                        const dataVal = item.data[col] || item.data[Object.keys(item.data).find(k => k.trim().toLowerCase().replace(/^\uFEFF/, '') === col.toLowerCase()) || ''] || '-';
                        return (
                          <td key={col} className={`px-5 py-3.5 align-top font-mono ${hasError ? 'bg-rose-500/10 text-rose-300 font-medium' : 'text-slate-400'}`}>
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
              <div className="p-12 text-center text-sm text-slate-500">No clean rows available to display.</div>
            ) : (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-black/60 text-slate-300 border-b border-white/10 sticky top-0 shadow-sm z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-5 py-3 font-semibold tracking-wider uppercase text-[10px]">Row</th>
                    {columns.filter(c => c !== 'rowNumber').map(col => (
                      <th key={col} className="px-5 py-3 font-semibold tracking-wider uppercase text-[10px]">{col.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {summary.validRowsPreview.map((item, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-300">{item.rowNumber}</td>
                      {columns.filter(c => c !== 'rowNumber').map(col => {
                        const dataVal = item.data[col] || item.data[Object.keys(item.data).find(k => k.trim().toLowerCase().replace(/^\uFEFF/, '') === col.toLowerCase()) || ''] || '-';
                        return (
                          <td key={col} className="px-5 py-3.5 font-mono text-slate-400">{dataVal}</td>
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
