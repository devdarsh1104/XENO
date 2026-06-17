import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import type { ValidationSummary } from './types';

function App() {
  const [summary, setSummary] = useState<ValidationSummary | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="text-slate-800">
              <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight leading-none">DataFlow Validator</h1>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">By Devdarsh</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!summary ? (
          <FileUpload onUploadSuccess={(data) => setSummary(data)} />
        ) : (
          <Dashboard summary={summary} onReset={() => setSummary(null)} />
        )}
      </main>
    </div>
  );
}

export default App;
