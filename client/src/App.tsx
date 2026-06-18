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
      <div className="min-h-screen text-[var(--text-charcoal)] font-sans selection:bg-[var(--accent-sand)] selection:text-[var(--text-charcoal)]">
        <header className="sticky top-0 z-50 border-b border-[var(--border-soft)] bg-[var(--bg-cream)]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-[var(--accent-sage)]">
                <ShieldCheck size={28} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-heading font-medium tracking-tight text-[var(--text-charcoal)] leading-none">
                  DataFlow Validator
                </h1>
                <p className="text-[10px] font-semibold text-[var(--text-subtle)] uppercase tracking-widest mt-1">By Devdarsh</p>
              </div>
            </div>
            {summary && (
              <button 
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent-sage)] transition-colors"
              >
                Start New Session
              </button>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          {!summary ? (
            <FileUpload onUploadSuccess={(data) => {
              if (typeof data === 'string') {
                try {
                  setSummary(JSON.parse(data));
                } catch (e) {
                  console.error("Failed to parse string summary", e);
                }
              } else {
                setSummary(data);
              }
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
