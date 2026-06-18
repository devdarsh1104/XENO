import { useState, useRef } from 'react';
import { UploadCloud, FileType, Download, AlertCircle } from 'lucide-react';
import type { ValidationSummary } from '../types';
import { validateCSV } from '../utils/validator';

interface FileUploadProps {
  onUploadSuccess: (summary: ValidationSummary) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [chunkSize, setChunkSize] = useState<number | string>(1000);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg('Please select a file to upload.');
      return;
    }
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Only .csv files are supported.');
      return;
    }
    
    const parsedChunkSize = typeof chunkSize === 'number' ? chunkSize : parseInt(chunkSize, 10);
    const finalChunkSize = isNaN(parsedChunkSize) ? 1000 : parsedChunkSize;
    
    if (finalChunkSize < 1) {
      setErrorMsg('Chunk size must be at least 1.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('chunkSize', finalChunkSize.toString());

    try {
      const summary = await validateCSV(file, finalChunkSize, (progress) => {
        setUploadProgress(progress);
      });
      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess(summary);
      }, 300);
    } catch (error: any) {
      setIsUploading(false);
      setUploadProgress(0);
      setErrorMsg(error.message || 'An unexpected error occurred during client-side validation.');
    }
  };

  const handleDownloadSample = () => {
    window.location.href = '/sample_transactions.csv';
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-6">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-heading font-medium text-[var(--text-charcoal)] mb-3">Upload Data</h2>
        <p className="text-[var(--text-muted)] text-sm">Select a CSV dataset to process and validate.</p>
      </div>

      <div className="editorial-panel p-10">
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ease-out ${
            isDragging 
              ? 'border-[var(--accent-sage)] bg-[var(--accent-sage-light)]' 
              : 'border-[var(--accent-sand)] hover:border-[var(--accent-sage)] hover:bg-[var(--bg-cream)]'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
          
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-[var(--accent-sage)] text-white' : 'bg-[var(--bg-cream-darker)] text-[var(--accent-sage)] group-hover:bg-[var(--accent-sage-light)]'}`}>
              {file ? <FileType size={32} /> : <UploadCloud size={32} />}
            </div>
          </div>
          
          <h3 className="text-base font-semibold text-[var(--text-charcoal)] mb-2">
            {file ? file.name : "Click to upload or drag and drop"}
          </h3>
          <p className="text-[var(--text-muted)] text-sm">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "CSV files up to 10MB"}
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 p-4 bg-[var(--accent-terra-light)] text-[var(--accent-terra)] rounded-lg flex items-start border border-[var(--border-soft-hover)]">
            <AlertCircle size={18} className="mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <div className="mt-10 space-y-8">
          <div>
            <label htmlFor="chunkSize" className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">
              Rows per Output Chunk
            </label>
            <input 
              id="chunkSize"
              type="number" 
              min="1"
              value={chunkSize}
              onChange={(e) => {
                const val = e.target.value;
                setChunkSize(val === '' ? '' : parseInt(val, 10));
              }}
              className="w-full px-4 py-3 bg-[var(--bg-cream)] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-[var(--text-charcoal)] focus:outline-none focus:border-[var(--accent-sage)] focus:ring-1 focus:ring-[var(--accent-sage)] transition-all"
              disabled={isUploading}
            />
          </div>

          <button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`w-full py-4 text-sm flex items-center justify-center transition-all duration-300 ${
              !file || isUploading 
                ? 'bg-[var(--border-soft-hover)] text-[var(--text-subtle)] rounded-full cursor-not-allowed' 
                : 'editorial-button'
            }`}
          >
            {isUploading ? `Processing Data... ${uploadProgress}%` : 'Upload & Validate'}
          </button>
        </div>

        {isUploading && (
          <div className="mt-6">
            <div className="w-full bg-[var(--bg-cream-darker)] rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[var(--accent-sage)] h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 text-center">
        <button 
          onClick={handleDownloadSample}
          className="text-xs font-semibold uppercase tracking-widest text-[var(--text-subtle)] hover:text-[var(--accent-sage)] inline-flex items-center transition-colors duration-300"
        >
          <Download size={16} className="mr-2" />
          Download Sample Dataset
        </button>
      </div>
    </div>
  );
}
