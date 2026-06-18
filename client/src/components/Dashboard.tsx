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
          <h2 className="text-4xl font-heading font-medium text-[#232220]">Validation Results</h2>
          <p className="text-sm text-[#6b6a65] mt-2">Review the processed data and export your chunks.</p>
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
            <p className="text-[10px] font-bold text-[#a19f99] uppercase tracking-widest">Total Rows</p>
            <Database size={20} className="text-[#d1bfae]" />
          </div>
          <h3 className="text-5xl font-heading font-medium text-[#232220]">{summary.totalRows}</h3>
        </div>

        <div className="editorial-panel p-8 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-6">
            <p className="text-[10px] font-bold text-[#4a6755] uppercase tracking-widest">Valid Rows</p>
            <CheckCircle2 size={20} className="text-[#4a6755]" />
          </div>
          <h3 className="text-5xl font-heading font-medium text-[#4a6755]">{summary.validRowsCount}</h3>
        </div>

        <div className="editorial-panel p-8 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-6">
            <p className="text-[10px] font-bold text-[#c26d5c] uppercase tracking-widest">Invalid Rows</p>
            <XCircle size={20} className="text-[#c26d5c]" />
          </div>
          <h3 className="text-5xl font-heading font-medium text-[#c26d5c]">{summary.invalidRowsCount}</h3>
        </div>

        <div className="editorial-panel p-8 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-6">
            <p className="text-[10px] font-bold text-[#d1bfae] uppercase tracking-widest">Duplicates</p>
            <AlertTriangle size={20} className="text-[#d1bfae]" />
          </div>
          <h3 className="text-5xl font-heading font-medium text-[#232220]">{summary.duplicateRowsCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Error Distribution */}
        <div className="editorial-panel lg:col-span-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-[rgba(0,0,0,0.04)] bg-[#fcfbf9]/50">
            <h3 className="text-base font-heading font-medium text-[#232220]">Error Distribution</h3>
          </div>
          <div className="p-6 flex-1 overflow-y-auto max-h-[320px]">
            {Object.keys(summary.errorsByField).length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-[#a19f99] text-sm">No errors found.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {Object.entries(summary.errorsByField)
                  .sort((a, b) => b[1] - a[1])
                  .map(([field, count]) => (
                  <li key={field} className="flex justify-between items-center text-sm group">
                    <span className="font-mono text-[#6b6a65] bg-[#f5f4ef] border border-[#e2e1dc] px-3 py-1.5 rounded-md text-xs">{field}</span>
                    <span className="text-[#c26d5c] text-xs font-bold bg-[#fbeae7] px-2.5 py-1 rounded-md border border-[#f5dcd7]">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="editorial-panel lg:col-span-2 overflow-hidden">
           <div className="p-6 border-b border-[rgba(0,0,0,0.04)] bg-[#fcfbf9]/50">
            <h3 className="text-base font-heading font-medium text-[#232220]">Exports</h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button 
              onClick={() => handleDownload('cleaned')}
              disabled={summary.validRowsCount === 0}
              className={`p-6 rounded-2xl flex items-start text-left transition-all duration-300 border ${
                summary.validRowsCount === 0 
                  ? 'bg-[#fcfbf9] border-transparent text-[#a19f99] cursor-not-allowed' 
                  : 'bg-white border-[#e8edea] hover:border-[#4a6755] hover:shadow-[0_4px_20px_rgba(74,103,85,0.08)] group'
              }`}
            >
              <div className={`p-3 rounded-full mt-0.5 mr-4 ${summary.validRowsCount === 0 ? 'bg-[#f5f4ef] text-[#a19f99]' : 'bg-[#e8edea] text-[#4a6755] group-hover:bg-[#4a6755] group-hover:text-white transition-colors'}`}>
                <CheckCircle2 size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className={`text-base font-medium ${summary.validRowsCount === 0 ? 'text-[#a19f99]' : 'text-[#232220]'}`}>Cleaned Dataset</h4>
                <p className="text-xs mt-2 text-[#6b6a65] leading-relaxed">Valid rows only. Pre-chunked ({summary.chunkCount}).</p>
              </div>
            </button>

            <button 
              onClick={() => handleDownload('errors')}
              disabled={summary.invalidRowsCount === 0}
              className={`p-6 rounded-2xl flex items-start text-left transition-all duration-300 border ${
                summary.invalidRowsCount === 0 
                  ? 'bg-[#fcfbf9] border-transparent text-[#a19f99] cursor-not-allowed' 
                  : 'bg-white border-[#fbeae7] hover:border-[#c26d5c] hover:shadow-[0_4px_20px_rgba(194,109,92,0.08)] group'
              }`}
            >
              <div className={`p-3 rounded-full mt-0.5 mr-4 ${summary.invalidRowsCount === 0 ? 'bg-[#f5f4ef] text-[#a19f99]' : 'bg-[#fbeae7] text-[#c26d5c] group-hover:bg-[#c26d5c] group-hover:text-white transition-colors'}`}>
                <XCircle size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className={`text-base font-medium ${summary.invalidRowsCount === 0 ? 'text-[#a19f99]' : 'text-[#232220]'}`}>Error Log</h4>
                <p className="text-xs mt-2 text-[#6b6a65] leading-relaxed">Invalid rows appended with error reasons.</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Data Previews */}
      <div className="editorial-panel overflow-hidden flex flex-col">
        <div className="flex border-b border-[rgba(0,0,0,0.04)] bg-[#fcfbf9]">
          <button 
            onClick={() => setActiveTab('errors')}
            className={`px-8 py-5 text-sm font-medium transition-colors duration-300 border-b-[2px] ${
              activeTab === 'errors' ? 'border-[#232220] text-[#232220] bg-white' : 'border-transparent text-[#6b6a65] hover:text-[#232220] hover:bg-white'
            }`}
          >
            Issues <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] ${activeTab === 'errors' ? 'bg-[#f5f4ef] text-[#232220]' : 'bg-[#e2e1dc]'}`}>{Math.min(summary.invalidRowsCount, 100)}</span>
          </button>
          <button 
            onClick={() => setActiveTab('valid')}
            className={`px-8 py-5 text-sm font-medium transition-colors duration-300 border-b-[2px] ${
              activeTab === 'valid' ? 'border-[#232220] text-[#232220] bg-white' : 'border-transparent text-[#6b6a65] hover:text-[#232220] hover:bg-white'
            }`}
          >
            Clean Data <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] ${activeTab === 'valid' ? 'bg-[#f5f4ef] text-[#232220]' : 'bg-[#e2e1dc]'}`}>{Math.min(summary.validRowsCount, 100)}</span>
          </button>
        </div>

        <div className="overflow-x-auto bg-white max-h-[600px]">
          {activeTab === 'errors' ? (
            summary.invalidRowsPreview.length === 0 ? (
              <div className="p-16 text-center text-sm text-[#a19f99]">No issues detected in the dataset.</div>
            ) : (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-[#fcfbf9] text-[#6b6a65] border-b border-[rgba(0,0,0,0.06)] sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-widest uppercase text-[10px]">Row</th>
                    <th className="px-6 py-4 font-semibold tracking-widest uppercase text-[10px] min-w-[300px]">Error Reasons</th>
                    {columns.filter(c => c !== 'rowNumber').map(col => (
                      <th key={col} className="px-6 py-4 font-semibold tracking-widest uppercase text-[10px]">{col.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
                  {summary.invalidRowsPreview.map((item, i) => (
                    <tr key={i} className="hover:bg-[#fcfbf9] transition-colors">
                      <td className="px-6 py-4 font-mono text-[#6b6a65] align-top">{item.rowNumber}</td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          {item.errors.map((err, idx) => (
                            <span key={idx} className="text-[11px] bg-[#fbeae7] text-[#c26d5c] px-3 py-1.5 rounded-md border border-[#f5dcd7] inline-block w-fit">
                              <span className="font-bold">{err.field}:</span> {err.reason}
                            </span>
                          ))}
                        </div>
                      </td>
                      {columns.filter(c => c !== 'rowNumber').map(col => {
                        const hasError = item.errors.some(e => e.field === col);
                        const dataVal = item.data[col] || item.data[Object.keys(item.data).find(k => k.trim().toLowerCase().replace(/^\uFEFF/, '') === col.toLowerCase()) || ''] || '-';
                        return (
                          <td key={col} className={`px-6 py-4 align-top font-mono ${hasError ? 'bg-[#fbeae7]/50 text-[#c26d5c] font-medium' : 'text-[#6b6a65]'}`}>
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
              <div className="p-16 text-center text-sm text-[#a19f99]">No clean rows available to display.</div>
            ) : (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-[#fcfbf9] text-[#6b6a65] border-b border-[rgba(0,0,0,0.06)] sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-widest uppercase text-[10px]">Row</th>
                    {columns.filter(c => c !== 'rowNumber').map(col => (
                      <th key={col} className="px-6 py-4 font-semibold tracking-widest uppercase text-[10px]">{col.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
                  {summary.validRowsPreview.map((item, i) => (
                    <tr key={i} className="hover:bg-[#fcfbf9] transition-colors">
                      <td className="px-6 py-4 font-mono text-[#a19f99]">{item.rowNumber}</td>
                      {columns.filter(c => c !== 'rowNumber').map(col => {
                        const dataVal = item.data[col] || item.data[Object.keys(item.data).find(k => k.trim().toLowerCase().replace(/^\uFEFF/, '') === col.toLowerCase()) || ''] || '-';
                        return (
                          <td key={col} className="px-6 py-4 font-mono text-[#6b6a65]">{dataVal}</td>
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
