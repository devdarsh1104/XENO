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
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-heading font-medium text-[#232220] mb-3">Upload Data</h2>
        <p className="text-[#6b6a65] text-sm">Select a CSV dataset to process and validate.</p>
      </div>

      <div className="editorial-panel p-10">
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ease-out ${
            isDragging 
              ? 'border-[#4a6755] bg-[#e8edea]' 
              : 'border-[#d1bfae] hover:border-[#4a6755] hover:bg-[#fcfbf9]'
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
            <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-[#4a6755] text-white' : 'bg-[#f5f4ef] text-[#4a6755] group-hover:bg-[#e8edea]'}`}>
              {file ? <FileType size={32} /> : <UploadCloud size={32} />}
            </div>
          </div>
          
          <h3 className="text-base font-semibold text-[#232220] mb-2">
            {file ? file.name : "Click to upload or drag and drop"}
          </h3>
          <p className="text-[#6b6a65] text-sm">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "CSV files up to 10MB"}
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 p-4 bg-[#fbeae7] text-[#c26d5c] rounded-lg flex items-start border border-[#f5dcd7]">
            <AlertCircle size={18} className="mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <div className="mt-10 space-y-8">
          <div>
            <label htmlFor="chunkSize" className="block text-xs font-semibold text-[#6b6a65] uppercase tracking-widest mb-3">
              Rows per Output Chunk
            </label>
            <input 
              id="chunkSize"
              type="number" 
              min="1"
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value) || 1000)}
              className="w-full px-4 py-3 bg-[#fcfbf9] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-[#232220] focus:outline-none focus:border-[#4a6755] focus:ring-1 focus:ring-[#4a6755] transition-all"
              disabled={isUploading}
            />
          </div>

          <button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`w-full py-4 text-sm flex items-center justify-center transition-all duration-300 ${
              !file || isUploading 
                ? 'bg-[#e2e1dc] text-[#9a9891] rounded-full cursor-not-allowed' 
                : 'editorial-button'
            }`}
          >
            {isUploading ? `Processing Data... ${uploadProgress}%` : 'Upload & Validate'}
          </button>
        </div>

        {isUploading && (
          <div className="mt-6">
            <div className="w-full bg-[#f5f4ef] rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[#4a6755] h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 text-center">
        <button 
          onClick={handleDownloadSample}
          className="text-xs font-semibold uppercase tracking-widest text-[#a19f99] hover:text-[#4a6755] inline-flex items-center transition-colors duration-300"
        >
          <Download size={16} className="mr-2" />
          Download Sample Dataset
        </button>
      </div>
    </div>
  );
}
