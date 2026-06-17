import { useState, useRef } from 'react';
import { UploadCloud, FileType, Download, AlertCircle } from 'lucide-react';
import type { ValidationSummary } from '../types';
import { validateCSV } from '../utils/validator';

interface FileUploadProps {
  onUploadSuccess: (summary: ValidationSummary) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [chunkSize, setChunkSize] = useState<number>(1000);
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
    if (chunkSize < 1) {
      setErrorMsg('Chunk size must be at least 1.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('chunkSize', chunkSize.toString());

    try {
      const summary = await validateCSV(file, chunkSize, (progress) => {
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
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-heading font-bold text-white mb-2 tracking-wide">Upload Data</h2>
        <p className="text-slate-400 text-sm">Select a CSV dataset to process and validate.</p>
      </div>

      <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
        {/* Subtle background glow effect inside the panel */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-cyan-500/10 blur-[50px] pointer-events-none"></div>

        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ease-out z-10 ${
            isDragging 
              ? 'border-cyan-400 bg-cyan-500/5 shadow-[0_0_30px_rgba(0,242,254,0.15)]' 
              : 'border-white/10 hover:border-cyan-500/50 hover:bg-white/5'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
          
          <div className="flex justify-center mb-5">
            <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-300 group-hover:text-cyan-400 group-hover:bg-cyan-500/10'}`}>
              {file ? <FileType size={32} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]" /> : <UploadCloud size={32} />}
            </div>
          </div>
          
          <h3 className="text-base font-semibold text-white mb-1.5 tracking-wide">
            {file ? file.name : "Click to upload or drag and drop"}
          </h3>
          <p className="text-slate-400 text-sm font-medium">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "CSV files up to 10MB"}
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 p-4 bg-rose-500/10 text-rose-400 rounded-lg flex items-start border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)] relative z-10">
            <AlertCircle size={18} className="mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <div className="mt-8 space-y-6 relative z-10">
          <div>
            <label htmlFor="chunkSize" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Rows per Output Chunk
            </label>
            <input 
              id="chunkSize"
              type="number" 
              min="1"
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value) || 1000)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
              disabled={isUploading}
            />
          </div>

          <button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`w-full py-3.5 rounded-lg text-sm flex items-center justify-center transition-all duration-300 ${
              !file || isUploading 
                ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5' 
                : 'neon-button'
            }`}
          >
            {isUploading ? `Processing Data... ${uploadProgress}%` : 'Upload & Validate'}
          </button>
        </div>

        {isUploading && (
          <div className="mt-6 relative z-10">
            <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,242,254,0.5)]"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <button 
          onClick={handleDownloadSample}
          className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-cyan-400 inline-flex items-center transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]"
        >
          <Download size={14} className="mr-2" />
          Download Sample Dataset
        </button>
      </div>
    </div>
  );
}
