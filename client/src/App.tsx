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
      <div className="min-h-screen text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-50">
        <header className="sticky top-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4facfe] to-[#00f2fe] p-[1px]">
                <div className="w-full h-full rounded-xl bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <ShieldCheck size={22} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-white tracking-wide">
                  DataFlow <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Validator</span>
                </h1>
                <p className="text-[10px] font-semibold text-cyan-500/70 uppercase tracking-[0.2em] mt-0.5 ml-0.5">By Devdarsh (Latest)</p>
              </div>
            </div>
            {summary && (
              <button 
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Reset Session
              </button>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
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
