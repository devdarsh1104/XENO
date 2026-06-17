import { TransactionRow, RowValidationResult, ValidationError } from './types';
import { VALIDATION_CONFIG } from './config';

function safeString(val: any): string {
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

function isEmpty(val: any): boolean {
  return safeString(val) === '';
}

// Helper to check if a calendar date is valid
function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1000 || year > 3000) return false;

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInMonths = [
    31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
  ];

  return day <= daysInMonths[month - 1];
}

// Parse date string and check against supported formats
function parseAndValidateDate(dateStr: string): { isValid: boolean; reason?: string } {
  let matched = false;
  let year = 0;
  let month = 0;
  let day = 0;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    matched = true;
    const parts = dateStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  }
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    matched = true;
    const parts = dateStr.split('/');
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const p3 = parseInt(parts[2], 10);

    const isValidAsMMDD = isValidCalendarDate(p3, p1, p2);
    const isValidAsDDMM = isValidCalendarDate(p3, p2, p1);

    if (isValidAsMMDD || isValidAsDDMM) {
      year = p3;
      if (isValidAsMMDD) {
        month = p1;
        day = p2;
      } else {
        month = p2;
        day = p1;
      }
    } else {
      return { isValid: false, reason: `Invalid day/month calendar values in date: ${dateStr}` };
    }
  }

  if (!matched) {
    return {
      isValid: false,
      reason: `Does not match allowed formats: ${VALIDATION_CONFIG.allowedDateFormats.join(', ')}`
    };
  }

  if (!isValidCalendarDate(year, month, day)) {
    return {
      isValid: false,
      reason: `Date is calendar-invalid (e.g. Feb 31, or invalid month/day combo)`
    };
  }

  return { isValid: true };
}

function validateTime(timeStr: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(timeStr);
}

function validatePhoneNumber(phoneStr: string, countryCode: string): { isValid: boolean; cleaned: string; reason?: string } {
  const cleaned = phoneStr.replace(/[\s\-\(\)]/g, '');
  
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, cleaned, reason: 'Contains non-numeric characters after cleaning' };
  }

  const rule = VALIDATION_CONFIG.phoneRules[countryCode.toUpperCase()];
  if (!rule) {
    // If country code is unknown, don't fail, just pass for generic datasets
    return { isValid: true, cleaned };
  }

  const len = cleaned.length;
  if (len < rule.minDigits || len > rule.maxDigits) {
    if (rule.minDigits === rule.maxDigits) {
      return { 
        isValid: false, 
        cleaned, 
        reason: `Phone number for ${rule.countryName} (${countryCode}) must be exactly ${rule.minDigits} digits, got ${len}` 
      };
    } else {
      return { 
        isValid: false, 
        cleaned, 
        reason: `Phone number for ${rule.countryName} (${countryCode}) must be between ${rule.minDigits} and ${rule.maxDigits} digits, got ${len}` 
      };
    }
  }

  return { isValid: true, cleaned };
}

export function validateTransactions(rows: TransactionRow[]): RowValidationResult[] {
  const seenOrderIds = new Set<string>();
  const seenTransactionIds = new Set<string>();
  const results: RowValidationResult[] = [];
  
  // Generic duplicate detection for the first column of ANY dataset
  const seenGenericIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const errors: ValidationError[] = [];
    let isDuplicate = false;

    const addError = (field: string, reason: string) => {
      errors.push({
        row: rowNumber,
        field,
        value: safeString(row[field]),
        reason
      });
    };
    
    // Dynamic duplicate check for generic files: Check the first key
    const keys = Object.keys(row);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const firstVal = safeString(row[firstKey]);
      if (firstVal !== '' && firstKey !== 'order_id' && firstKey !== 'transaction_id') {
        if (firstKey.toLowerCase().includes('id')) {
           if (seenGenericIds.has(firstVal)) {
             isDuplicate = true;
             addError(firstKey, `Duplicate ${firstKey}: "${firstVal}" has already been processed`);
           } else {
             seenGenericIds.add(firstVal);
           }
        }
      }
    }

    // 1. order_id (Optional)
    if (!isEmpty(row.order_id)) {
      const orderId = safeString(row.order_id);
      if (seenOrderIds.has(orderId)) {
        isDuplicate = true;
        addError('order_id', `Duplicate Order ID: "${orderId}" has already been processed`);
      } else {
        seenOrderIds.add(orderId);
      }
    }

    // 2. country_code (Optional check for phone rules)
    const cc = !isEmpty(row.country_code) ? safeString(row.country_code).toUpperCase() : '';

    // 3. customer_phone / phone_number (Optional)
    const phoneField = !isEmpty(row.customer_phone) ? 'customer_phone' : (!isEmpty(row.phone_number) ? 'phone_number' : null);
    if (phoneField) {
      const phoneVal = safeString(row[phoneField]);
      // If we have a country code, validate strictly. Otherwise, just check if it has weird text.
      if (cc && VALIDATION_CONFIG.phoneRules[cc]) {
        const phoneCheck = validatePhoneNumber(phoneVal, cc);
        if (!phoneCheck.isValid) {
          addError(phoneField, phoneCheck.reason || 'Invalid phone number format');
        }
      } else {
        const cleaned = phoneVal.replace(/[\s\-\(\)\+]/g, '');
        if (!/^\d+$/.test(cleaned)) {
          addError(phoneField, 'Phone number contains invalid non-numeric characters');
        }
      }
    }

    // 4. Dates (Optional dynamic check on any field ending in _date)
    keys.forEach(key => {
      if (key.toLowerCase().includes('date') && !isEmpty(row[key])) {
         const dateCheck = parseAndValidateDate(safeString(row[key]));
         if (!dateCheck.isValid) {
           addError(key, dateCheck.reason || 'Invalid date format');
         }
      }
    });

    // 5. order_time (Optional)
    if (!isEmpty(row.order_time)) {
      if (!validateTime(safeString(row.order_time))) {
        addError('order_time', 'Time must be in HH:mm or HH:mm:ss 24-hour format');
      }
    }

    // 6. quantity (Optional)
    let qtyNum = 0;
    if (!isEmpty(row.quantity)) {
      const qtyStr = safeString(row.quantity);
      if (!/^\d+$/.test(qtyStr)) {
        addError('quantity', 'Quantity must be a positive integer');
      } else {
        qtyNum = parseInt(qtyStr, 10);
        if (qtyNum <= 0) {
          addError('quantity', 'Quantity must be greater than 0');
        }
      }
    }

    // 7. unit_price (Optional)
    let priceNum = -1;
    if (!isEmpty(row.unit_price)) {
      const priceStr = safeString(row.unit_price);
      if (isNaN(Number(priceStr))) {
        addError('unit_price', 'Unit price must be numeric');
      } else {
        priceNum = Number(priceStr);
        if (priceNum < 0) {
          addError('unit_price', 'Unit price must be greater than or equal to 0');
        }
      }
    }

    // 8. total_amount (Optional)
    let totalNum = -1;
    if (!isEmpty(row.total_amount)) {
      const totalStr = safeString(row.total_amount);
      if (isNaN(Number(totalStr))) {
        addError('total_amount', 'Total amount must be numeric');
      } else {
        totalNum = Number(totalStr);
        if (totalNum < 0) {
          addError('total_amount', 'Total amount must be greater than or equal to 0');
        }
      }
    }

    // 9. quantity * unit_price check
    if (qtyNum > 0 && priceNum >= 0 && totalNum >= 0) {
      const calculatedAmount = qtyNum * priceNum;
      const difference = Math.abs(calculatedAmount - totalNum);
      if (difference > VALIDATION_CONFIG.amountTolerance) {
        addError(
          'total_amount',
          `Total amount (${totalNum}) does not match calculated amount (${qtyNum} * ${priceNum} = ${calculatedAmount.toFixed(2)}), exceeds tolerance`
        );
      }
    }

    // 10. payment_mode (Optional)
    if (!isEmpty(row.payment_mode)) {
      const pm = safeString(row.payment_mode).toUpperCase();
      if (!VALIDATION_CONFIG.allowedPaymentModes.includes(pm)) {
        addError('payment_mode', `Payment mode must be one of: ${VALIDATION_CONFIG.allowedPaymentModes.join(', ')}`);
      }
    }

    // 11. payment_status (Optional)
    let statusClean = '';
    if (!isEmpty(row.payment_status)) {
      statusClean = safeString(row.payment_status).toUpperCase();
      if (!VALIDATION_CONFIG.allowedPaymentStatuses.includes(statusClean)) {
        addError('payment_status', `Payment status must be one of: ${VALIDATION_CONFIG.allowedPaymentStatuses.join(', ')}`);
      }
    }

    // 12. transaction_id (Optional)
    const txnId = isEmpty(row.transaction_id) ? '' : safeString(row.transaction_id);
    if (statusClean === 'PAID' && txnId === '') {
      addError('transaction_id', 'Transaction ID is required when payment status is PAID');
    }

    if (txnId !== '') {
      if (seenTransactionIds.has(txnId)) {
        isDuplicate = true;
        addError('transaction_id', `Duplicate Transaction ID: "${txnId}" has already been processed in this file`);
      } else {
        seenTransactionIds.add(txnId);
      }
    }

    // 13. currency (Optional)
    if (!isEmpty(row.currency)) {
      const curr = safeString(row.currency).toUpperCase();
      if (!/^[A-Z]{3}$/.test(curr)) {
        addError('currency', 'Currency must be a valid 3-letter ISO-style code (e.g. USD)');
      }
    }

    results.push({
      rowNumber,
      isValid: errors.length === 0,
      isDuplicate,
      data: row,
      errors
    });
  });

  return results;
}
