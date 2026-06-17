import Papa from 'papaparse';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import type { ValidationSummary, ValidationError } from '../types';

export const validateCSV = async (
  file: File, 
  chunkSize: number,
  onProgress: (percent: number) => void
): Promise<ValidationSummary> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: async (results) => {
        try {
          const rawRows = results.data as any[];
          const headers = results.meta.fields || [];
          
          if (!headers.includes('order_id')) {
            headers.push('order_id');
          }

          const validRows: any[] = [];
          const invalidRows: any[] = [];
          const errorsByField: Record<string, number> = {};
          
          const uniqueOrderIds = new Set<string>();
          const uniqueCustomerPhones = new Set<string>();
          let duplicateCount = 0;

          // Process each row
          rawRows.forEach((row, index) => {
            const rowNumber = index + 1;
            const errors: ValidationError[] = [];

            const pushError = (field: string, reason: string, value: string = '') => {
              errors.push({ row: rowNumber, field, value, reason });
            };

            const getVal = (row: any, ...keys: string[]) => {
              const rowKeys = Object.keys(row);
              for (const searchKey of keys) {
                const target = searchKey.trim().toLowerCase();
                const matchedKey = rowKeys.find(k => k.trim().toLowerCase().replace(/^\uFEFF/, '') === target);
                if (matchedKey && row[matchedKey]) return String(row[matchedKey] || '').trim();
              }
              return '';
            };

            // 1. Order ID (Mandatory, unique)
            const orderId = getVal(row, 'order_id', 'orderid', 'order id');
            if (!orderId) {
              pushError('order_id', 'Missing order_id');
            } else if (uniqueOrderIds.has(orderId)) {
              pushError('order_id', `Duplicate order_id: ${orderId}`);
            } else {
              uniqueOrderIds.add(orderId);
            }

            // 2. Customer Phone (Valid Indian number format: 10 digits, starts with 6-9, unique)
            let phone = getVal(row, 'customer_phone', 'customer phone', 'phone', 'phone_number');
            let countryCode = getVal(row, 'country_code', 'country code', 'countrycode');
            if (phone.startsWith('+91')) {
              phone = phone.replace('+91', '');
              countryCode = '+91';
            }
            if (!/^[6-9]\d{9}$/.test(phone)) {
              pushError('customer_phone', 'Invalid Indian phone number format', phone);
            } else if (uniqueCustomerPhones.has(phone)) {
              pushError('customer_phone', `Duplicate customer_phone: ${phone}`, phone);
            } else {
              uniqueCustomerPhones.add(phone);
              // Store normalized values back with exactly matching dashboard column keys
              row.customer_phone = phone; 
              row.country_code = countryCode || '+91'; 
            }

            // 3. Signup Date (Format: YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY)
            const rawSignupDate = getVal(row, 'signup_date', 'signup date', 'signupdate', 'date');
            if (rawSignupDate) {
              const d1 = /^\d{4}-\d{2}-\d{2}$/.test(rawSignupDate);
              const d2 = /^\d{2}\/\d{2}\/\d{4}$/.test(rawSignupDate);
              if (!d1 && !d2) {
                // Try parsing with Date object to see if it's generally valid
                const parsedDate = new Date(rawSignupDate);
                if (isNaN(parsedDate.getTime())) {
                   pushError('signup_date', 'Does not match allowed formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, or valid Date/Time string', rawSignupDate);
                }
              }
            } else {
               pushError('signup_date', 'Missing signup_date');
            }

            // Ensure React can read the fields when rendering
            row.order_id = orderId;
            row.signup_date = rawSignupDate;

            if (errors.length > 0) {
              invalidRows.push({ rowNumber, errors, data: row });
              errors.forEach((err) => {
                errorsByField[err.field] = (errorsByField[err.field] || 0) + 1;
                if (err.reason.startsWith('Duplicate')) {
                  duplicateCount++;
                }
              });
            } else {
              validRows.push(row);
            }
            
            // Progress estimation for parsing
            if (index % 500 === 0) {
              onProgress(Math.min(40, Math.round((index / rawRows.length) * 40)));
            }
          });

          onProgress(50); // Parsing & Validation done

          // Create ZIP File in memory
          const zip = new JSZip();
          const chunkCount = Math.ceil(validRows.length / chunkSize);
          
          if (chunkCount > 0) {
            const chunksFolder = zip.folder("chunks");
            if (chunksFolder) {
              for (let i = 0; i < chunkCount; i++) {
                const chunkData = validRows.slice(i * chunkSize, (i + 1) * chunkSize);
                const chunkCsv = Papa.unparse({ fields: headers, data: chunkData });
                chunksFolder.file(`chunk_${i + 1}.csv`, chunkCsv);
              }
            }
          }
          
          onProgress(70);

          const cleanedCsvContent = Papa.unparse({ fields: headers, data: validRows });
          zip.file('cleaned_validated_output.csv', cleanedCsvContent);

          const errorsCsvContent = Papa.unparse(invalidRows.map(r => ({
            ...r.data,
            error_reasons: r.errors.map((e: ValidationError) => `${e.field}: ${e.reason}`).join(' | ')
          })));
          zip.file('validation_errors.csv', errorsCsvContent);
          
          onProgress(90);

          const zipBlob = await zip.generateAsync({ type: "base64" });
          
          onProgress(100);

          const validPreviewLimit = 100;
          const invalidPreviewLimit = 100;

          resolve({
            sessionId: uuidv4(),
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
            chunkCount,
            zipBase64: zipBlob,
            cleanedCsvContent,
            errorsCsvContent
          });

        } catch (err) {
          reject(err);
        }
      },
      error: (err: any) => {
        reject(err);
      }
    });
  });
};
