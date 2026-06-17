import { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, FileType, Download, AlertCircle } from 'lucide-react';
import type { ValidationSummary } from '../types';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5001';

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
      const response = await axios.post<ValidationSummary>(`${API_BASE_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });
      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess(response.data);
      }, 300);
    } catch (error: any) {
      setIsUploading(false);
      setUploadProgress(0);
      if (error.response?.data?.error) {
        setErrorMsg(error.response.data.error);
      } else {
        setErrorMsg('An unexpected error occurred during upload. Please check if the server is running.');
      }
    }
  };

  const handleDownloadSample = () => {
    window.open(`${API_BASE_URL}/api/sample-csv`, '_blank');
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-10">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Upload Data</h2>
        <p className="text-slate-500 text-sm mt-1">Select a CSV dataset to process and validate.</p>
      </div>

      <div className="saas-card rounded-xl p-8">
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-slate-800 bg-slate-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
          
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-slate-100 rounded-full text-slate-600">
              {file ? <FileType size={24} /> : <UploadCloud size={24} />}
            </div>
          </div>
          
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            {file ? file.name : "Click to upload or drag and drop"}
          </h3>
          <p className="text-slate-500 text-xs">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "CSV up to 10MB"}
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center border border-red-200">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            <p className="text-xs font-medium">{errorMsg}</p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="chunkSize" className="block text-xs font-medium text-slate-700 mb-1">
              Rows per Output Chunk
            </label>
            <input 
              id="chunkSize"
              type="number" 
              min="1"
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value) || 1000)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              disabled={isUploading}
            />
          </div>

          <button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`w-full py-2.5 rounded-md text-sm transition-colors flex items-center justify-center ${
              !file || isUploading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'saas-button'
            }`}
          >
            {isUploading ? `Processing... ${uploadProgress}%` : 'Upload & Validate'}
          </button>
        </div>

        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-slate-900 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <button 
          onClick={handleDownloadSample}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 inline-flex items-center transition-colors"
        >
          <Download size={14} className="mr-1.5" />
          Download Sample Dataset
        </button>
      </div>
    </div>
  );
}
