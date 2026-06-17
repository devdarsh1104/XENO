import Papa from 'papaparse';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import type { ValidationSummary, ValidationError } from '../types';
import { validateTransactions } from './legacyValidator';

export const validateCSV = async (
  file: File, 
  chunkSize: number,
  onProgress: (percent: number) => void
): Promise<ValidationSummary> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      Papa.parse(text, {
        header: true,
        skipEmptyLines: 'greedy',
        complete: async (results) => {
          try {
            const rawRows = results.data as any[];
            const validationResults = validateTransactions(rawRows);

            const validRows: any[] = [];
            const invalidRows: any[] = [];
            const errorsByField: Record<string, number> = {};
            let duplicateCount = 0;

            for (const res of validationResults) {
              if (res.isDuplicate) duplicateCount++;

              if (res.isValid && !res.isDuplicate) {
                validRows.push(res.data);
              } else {
                invalidRows.push({ rowNumber: res.rowNumber, errors: res.errors, data: res.data });
                res.errors.forEach((err: ValidationError) => {
                  errorsByField[err.field] = (errorsByField[err.field] || 0) + 1;
                });
              }
            }

            let zipBlob: string | undefined;
            const chunkCount = Math.ceil(validRows.length / chunkSize);

            if (validRows.length > 0) {
              const zip = new JSZip();
              for (let i = 0; i < chunkCount; i++) {
                const chunk = validRows.slice(i * chunkSize, (i + 1) * chunkSize);
                const csvData = Papa.unparse(chunk);
                zip.file(`valid_transactions_chunk_${i + 1}.csv`, csvData);
              }
              const blob = await zip.generateAsync({ type: 'base64' });
              zipBlob = blob;
            }

            let cleanedCsvContent = '';
            if (validRows.length > 0) {
              cleanedCsvContent = Papa.unparse(validRows);
            }
            let errorsCsvContent = '';
            if (invalidRows.length > 0) {
              errorsCsvContent = Papa.unparse(invalidRows.map(r => ({
                ...r.data,
                error_reasons: r.errors.map((e: ValidationError) => `${e.field}: ${e.reason}`).join(' | ')
              })));
            }

            const validPreviewLimit = 5;
            resolve({
              sessionId: uuidv4(),
              totalRows: rawRows.length,
              validRowsCount: validRows.length,
              invalidRowsCount: invalidRows.length,
              duplicateRowsCount: duplicateCount,
              errorsByField,
              invalidRowsPreview: invalidRows,
              validRowsPreview: validRows.slice(0, validPreviewLimit),
              chunkCount,
              zipBase64: zipBlob || '',
              cleanedCsvContent,
              errorsCsvContent
            } as ValidationSummary);

          } catch (err) {
            reject(err);
          }
        },
        error: (err: any) => {
          reject(err);
        }
      });
    };
    reader.onerror = (err: any) => reject(err);
    reader.readAsText(file);
    onProgress(100);
  });
};
