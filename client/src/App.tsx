import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import type { ValidationSummary } from './types';

import React, { Component } from 'react';
import type { ErrorInfo } from 'react';

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-red-50 text-red-900 border border-red-200 rounded">
          <h1 className="text-2xl font-bold mb-4">React App Crashed!</h1>
          <p className="mb-4">An unhandled exception destroyed the React tree.</p>
          <pre className="bg-white p-4 text-xs overflow-auto">{this.state.error?.toString()}</pre>
          <pre className="bg-white p-4 text-xs overflow-auto mt-2">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [summary, setSummary] = useState<ValidationSummary | null>(null);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 font-sans">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="text-slate-800">
                <ShieldCheck size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight leading-none">DataFlow Validator</h1>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">By Devdarsh (Latest)</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!summary ? (
            <FileUpload onUploadSuccess={(data) => {
              if (typeof data === 'string') {
                throw new Error("API returned an HTML string instead of JSON payload. Vercel backend is missing! HTML Preview: " + (data as string).substring(0, 100));
              }
              if (!data || !data.invalidRowsPreview) {
                throw new Error("API returned invalid JSON data: " + JSON.stringify(data));
              }
              setSummary(data);
            }} />
          ) : (
            <Dashboard summary={summary} onReset={() => setSummary(null)} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
