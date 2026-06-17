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
    window.open(`http://localhost:5001/api/download/${summary.sessionId}/${fileType}`, '_blank');
  };

  const columns = [
    'rowNumber', 'order_id', 'customer_name', 'customer_phone', 'country_code', 
    'order_date', 'order_time', 'product_id', 'product_name', 'quantity', 
    'unit_price', 'total_amount', 'payment_mode', 'currency', 'transaction_id', 'payment_status'
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Validation Results</h2>
          <p className="text-sm text-slate-500 mt-1">Review the processed data and export your chunks.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onReset}
            className="saas-button-outline px-4 py-2 rounded-md text-sm inline-flex items-center"
          >
            <ArrowLeft size={16} className="mr-2" /> Start Over
          </button>
          <button 
            onClick={() => handleDownload('zip')}
            className="saas-button px-4 py-2 rounded-md text-sm inline-flex items-center"
          >
            <Archive size={16} className="mr-2" /> Download ZIP
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="saas-card p-5 rounded-xl border-l-4 border-l-slate-400">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Rows</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900 leading-none">{summary.totalRows}</h3>
            <Database size={20} className="text-slate-400" />
          </div>
        </div>

        <div className="saas-card p-5 rounded-xl border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Valid Rows</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900 leading-none">{summary.validRowsCount}</h3>
            <CheckCircle2 size={20} className="text-emerald-500" />
          </div>
        </div>

        <div className="saas-card p-5 rounded-xl border-l-4 border-l-rose-500">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">Invalid Rows</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900 leading-none">{summary.invalidRowsCount}</h3>
            <XCircle size={20} className="text-rose-500" />
          </div>
        </div>

        <div className="saas-card p-5 rounded-xl border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Duplicates</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900 leading-none">{summary.duplicateRowsCount}</h3>
            <AlertTriangle size={20} className="text-amber-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Error Distribution */}
        <div className="saas-card rounded-xl lg:col-span-1 flex flex-col">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Error Distribution</h3>
          </div>
          <div className="p-5 flex-1 overflow-y-auto">
            {Object.keys(summary.errorsByField).length === 0 ? (
              <p className="text-slate-500 text-sm">No errors found.</p>
            ) : (
              <ul className="space-y-3">
                {Object.entries(summary.errorsByField)
                  .sort((a, b) => b[1] - a[1])
                  .map(([field, count]) => (
                  <li key={field} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs">{field}</span>
                    <span className="text-slate-500 text-xs font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="saas-card rounded-xl lg:col-span-2">
           <div className="p-5 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Exports</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => handleDownload('cleaned')}
              disabled={summary.validRowsCount === 0}
              className={`p-4 rounded-lg flex items-start text-left transition-colors border ${
                summary.validRowsCount === 0 
                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 size={18} className={`mt-0.5 mr-3 ${summary.validRowsCount === 0 ? 'text-slate-300' : 'text-emerald-500'}`} />
              <div>
                <h4 className={`text-sm font-semibold ${summary.validRowsCount === 0 ? 'text-slate-400' : 'text-slate-900'}`}>Cleaned Dataset</h4>
                <p className="text-xs mt-1 text-slate-500">Valid rows only. Pre-chunked ({summary.chunkCount}).</p>
              </div>
            </button>

            <button 
              onClick={() => handleDownload('errors')}
              disabled={summary.invalidRowsCount === 0}
              className={`p-4 rounded-lg flex items-start text-left transition-colors border ${
                summary.invalidRowsCount === 0 
                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <XCircle size={18} className={`mt-0.5 mr-3 ${summary.invalidRowsCount === 0 ? 'text-slate-300' : 'text-rose-500'}`} />
              <div>
                <h4 className={`text-sm font-semibold ${summary.invalidRowsCount === 0 ? 'text-slate-400' : 'text-slate-900'}`}>Error Log</h4>
                <p className="text-xs mt-1 text-slate-500">Invalid rows appended with error reasons.</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Data Previews */}
      <div className="saas-card rounded-xl overflow-hidden flex flex-col">
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button 
            onClick={() => setActiveTab('errors')}
            className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'errors' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Issues ({Math.min(summary.invalidRowsCount, 100)})
          </button>
          <button 
            onClick={() => setActiveTab('valid')}
            className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'valid' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Clean Data ({Math.min(summary.validRowsCount, 100)})
          </button>
        </div>

        <div className="overflow-x-auto bg-white max-h-[500px]">
          {activeTab === 'errors' ? (
            summary.invalidRowsPreview.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No issues detected.</div>
            ) : (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold tracking-wide">Row</th>
                    <th className="px-4 py-2.5 font-semibold tracking-wide min-w-[250px]">Error Reasons</th>
                    {columns.filter(c => c !== 'rowNumber').map(col => (
                      <th key={col} className="px-4 py-2.5 font-semibold tracking-wide">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.invalidRowsPreview.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="px-4 py-2.5 font-medium text-slate-900 align-top">{item.rowNumber}</td>
                      <td className="px-4 py-2.5 align-top">
                        <div className="flex flex-col gap-1.5">
                          {item.errors.map((err, idx) => (
                            <span key={idx} className="text-[11px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100 inline-block w-fit">
                              <span className="font-semibold">{err.field}:</span> {err.reason}
                            </span>
                          ))}
                        </div>
                      </td>
                      {columns.filter(c => c !== 'rowNumber').map(col => {
                        const hasError = item.errors.some(e => e.field === col);
                        return (
                          <td key={col} className={`px-4 py-2.5 align-top ${hasError ? 'bg-rose-50/50 text-rose-700 font-medium' : 'text-slate-600'}`}>
                            {item.data[col] || '-'}
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
              <div className="p-8 text-center text-sm text-slate-500">No clean rows available.</div>
            ) : (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold tracking-wide">#</th>
                    {columns.filter(c => c !== 'rowNumber').map(col => (
                      <th key={col} className="px-4 py-2.5 font-semibold tracking-wide">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.validRowsPreview.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="px-4 py-2.5 font-medium text-slate-400">{i + 1}</td>
                      {columns.filter(c => c !== 'rowNumber').map(col => (
                        <td key={col} className="px-4 py-2.5 text-slate-600">
                          {row[col] || '-'}
                        </td>
                      ))}
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
