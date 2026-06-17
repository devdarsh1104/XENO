import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';

import { TransactionRow } from './types';
import { validateTransactions } from './validator';
import { VALIDATION_CONFIG } from './config';

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Set up temporary uploads directory
const UPLOADS_ROOT = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadTempDir = path.join(UPLOADS_ROOT, 'temp');
    if (!fs.existsSync(uploadTempDir)) {
      fs.mkdirSync(uploadTempDir, { recursive: true });
    }
    cb(null, uploadTempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: VALIDATION_CONFIG.maxFileSize }
});

// Helper: Wrap archiver zipping in a promise
function createZipArchive(zipPath: string, files: { filePath: string; name: string }[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    for (const file of files) {
      archive.file(file.filePath, { name: file.name });
    }
    archive.finalize();
  });
}

// Endpoint: Upload CSV, Validate, Chunk and Package
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const chunkSizeParam = parseInt(req.body.chunkSize, 10);
    const chunkSize = isNaN(chunkSizeParam) || chunkSizeParam <= 0 ? 1000 : chunkSizeParam;

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Remove temp upload file after reading
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Error removing temporary upload file:', err);
    }

    // Parse CSV content using Papaparse
    const parseResult = Papa.parse<TransactionRow>(fileContent, {
      header: true,
      skipEmptyLines: 'greedy'
    });

    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return res.status(400).json({
        error: 'Failed to parse CSV file. Ensure it is a valid comma-separated layout.',
        details: parseResult.errors
      });
    }

    const rawRows = parseResult.data;
    if (rawRows.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Run Validation
    const validationResults = validateTransactions(rawRows);

    // Grouping rows into Valid and Invalid
    const validRows: TransactionRow[] = [];
    const invalidRows: typeof validationResults = [];
    let duplicateCount = 0;
    const errorsByField: Record<string, number> = {};

    validationResults.forEach((res) => {
      if (res.isValid) {
        validRows.push(res.data);
      } else {
        invalidRows.push(res);
        if (res.isDuplicate) {
          duplicateCount++;
        }
        res.errors.forEach((err) => {
          errorsByField[err.field] = (errorsByField[err.field] || 0) + 1;
        });
      }
    });

    // Create session directories for files
    const sessionId = uuidv4();
    const sessionDir = path.join(UPLOADS_ROOT, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    // 1. Write cleaned_validated_output.csv
    const cleanedCsvContent = Papa.unparse(validRows);
    const cleanedPath = path.join(sessionDir, 'cleaned_validated_output.csv');
    fs.writeFileSync(cleanedPath, cleanedCsvContent, 'utf8');

    // 2. Write validation_errors.csv
    const errorRowsForCsv = invalidRows.flatMap((res) =>
      res.errors.map((err) => ({
        'Row Number': res.rowNumber,
        'Field Name': err.field,
        'Invalid Value': err.value,
        'Error Reason': err.reason,
        ...res.data
      }))
    );
    const errorsCsvContent = Papa.unparse(errorRowsForCsv);
    const errorsPath = path.join(sessionDir, 'validation_errors.csv');
    fs.writeFileSync(errorsPath, errorsCsvContent, 'utf8');

    // 3. Write chunks
    const filesToZip = [
      { filePath: cleanedPath, name: 'cleaned_validated_output.csv' },
      { filePath: errorsPath, name: 'validation_errors.csv' }
    ];

    const chunkCount = Math.ceil(validRows.length / chunkSize);
    const chunkDir = path.join(sessionDir, 'chunks');
    if (chunkCount > 0) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    for (let i = 0; i < chunkCount; i++) {
      const start = i * chunkSize;
      const end = start + chunkSize;
      const chunkRows = validRows.slice(start, end);
      const chunkCsvContent = Papa.unparse(chunkRows);
      
      const chunkFileName = `chunk_${i + 1}.csv`;
      const chunkPath = path.join(chunkDir, chunkFileName);
      fs.writeFileSync(chunkPath, chunkCsvContent, 'utf8');
      
      filesToZip.push({
        filePath: chunkPath,
        name: `chunks/${chunkFileName}`
      });
    }

    // 4. Create ZIP
    const zipPath = path.join(sessionDir, 'all_files.zip');
    await createZipArchive(zipPath, filesToZip);

    // Limit previews to keep JSON payloads lightweight
    const validPreviewLimit = 100;
    const invalidPreviewLimit = 100;

    res.json({
      sessionId,
      totalRows: rawRows.length,
      validRowsCount: validRows.length,
      invalidRowsCount: invalidRows.length,
      duplicateRowsCount: duplicateCount,
      errorsByField,
      invalidRowsPreview: invalidRows.slice(0, invalidPreviewLimit).map((r) => ({
        rowNumber: r.rowNumber,
        errors: r.errors,
        data: r.data
      })),
      validRowsPreview: validRows.slice(0, validPreviewLimit),
      chunkCount
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal Server Error during file processing', details: error.message });
  }
});

// Endpoint: Download endpoint
app.get('/api/download/:sessionId/:fileType', (req, res) => {
  const { sessionId, fileType } = req.params;
  const sessionDir = path.join(UPLOADS_ROOT, sessionId);

  if (!fs.existsSync(sessionDir)) {
    return res.status(404).json({ error: 'Session expired or not found. Please upload file again.' });
  }

  let filePath = '';
  let downloadName = '';

  if (fileType === 'cleaned') {
    filePath = path.join(sessionDir, 'cleaned_validated_output.csv');
    downloadName = 'cleaned_validated_output.csv';
  } else if (fileType === 'errors') {
    filePath = path.join(sessionDir, 'validation_errors.csv');
    downloadName = 'validation_errors.csv';
  } else if (fileType === 'zip') {
    filePath = path.join(sessionDir, 'all_files.zip');
    downloadName = 'transaction_validation_package.zip';
  } else if (fileType.startsWith('chunk-')) {
    const chunkNum = fileType.replace('chunk-', '');
    filePath = path.join(sessionDir, 'chunks', `chunk_${chunkNum}.csv`);
    downloadName = `chunk_${chunkNum}.csv`;
  } else {
    return res.status(400).json({ error: 'Invalid download file type requested.' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Requested file does not exist.' });
  }

  res.download(filePath, downloadName);
});

// Endpoint: Stream sample transaction template CSV
app.get('/api/sample-csv', (req, res) => {
  const sampleFilePath = path.join(__dirname, '../../sample_transactions.csv');
  if (fs.existsSync(sampleFilePath)) {
    res.download(sampleFilePath, 'sample_transactions.csv');
  } else {
    // Fallback if not found, write a minimal inline version
    const csvContent = 
`order_id,customer_name,customer_phone,country_code,order_date,order_time,product_id,product_name,quantity,unit_price,total_amount,payment_mode,currency,transaction_id,payment_status
ORD001,John Doe,9876543210,IN,2026-06-15,14:30:00,PROD101,Wireless Mouse,2,25.00,50.00,CARD,USD,TXN5001,PAID`;
    res.header('Content-Type', 'text/csv');
    res.attachment('sample_transactions.csv');
    res.send(csvContent);
  }
});

// Background Cleanup Process: Delete folders older than 1 hour
const CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 mins
const MAX_FILE_AGE = 60 * 60 * 1000; // 1 hour

setInterval(() => {
  fs.readdir(UPLOADS_ROOT, (err, folders) => {
    if (err) {
      console.error('Cleanup read directory error:', err);
      return;
    }

    const now = Date.now();
    folders.forEach((folder) => {
      // Skip the temp directory
      if (folder === 'temp') return;

      const folderPath = path.join(UPLOADS_ROOT, folder);
      fs.stat(folderPath, (err, stats) => {
        if (err) {
          console.error(`Cleanup stat error for folder ${folder}:`, err);
          return;
        }

        if (now - stats.mtime.getTime() > MAX_FILE_AGE) {
          fs.rm(folderPath, { recursive: true, force: true }, (rmErr) => {
            if (rmErr) {
              console.error(`Failed to delete expired session directory: ${folderPath}`, rmErr);
            } else {
              console.log(`Cleaned up expired session directory: ${folder}`);
            }
          });
        }
      });
    });
  });
}, CLEANUP_INTERVAL);

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Transaction Validator backend listening on http://localhost:${PORT}`);
  console.log(`[Server] Max file upload limit config is: ${VALIDATION_CONFIG.maxFileSize / (1024 * 1024)}MB`);
});
