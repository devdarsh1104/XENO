import { TransactionRow, RowValidationResult, ValidationError } from './types';
import { VALIDATION_CONFIG } from './config';

function safeString(val: any): string {
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

function isEmpty(val: any): boolean {
  return safeString(val) === '';
}

// Helper to check if a calendar date is valid (e.g. avoids Feb 31)
function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1000 || year > 3000) return false;

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInMonths = [
    31,                  // Jan
    isLeapYear ? 29 : 28, // Feb
    31,                  // Mar
    30,                  // Apr
    31,                  // May
    30,                  // Jun
    31,                  // Jul
    31,                  // Aug
    30,                  // Sep
    31,                  // Oct
    30,                  // Nov
    31                   // Dec
  ];

  return day <= daysInMonths[month - 1];
}

// Parse date string and check against supported formats
function parseAndValidateDate(dateStr: string): { isValid: boolean; reason?: string } {
  let matched = false;
  let year = 0;
  let month = 0;
  let day = 0;

  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    matched = true;
    const parts = dateStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  }
  // Try DD/MM/YYYY or MM/DD/YYYY
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

// Time validation helper
function validateTime(timeStr: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(timeStr);
}

// Phone validator helper
function validatePhoneNumber(phoneStr: string, countryCode: string): { isValid: boolean; cleaned: string; reason?: string } {
  const cleaned = phoneStr.replace(/[\s\-\(\)]/g, '');
  
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, cleaned, reason: 'Contains non-numeric characters after cleaning' };
  }

  const rule = VALIDATION_CONFIG.phoneRules[countryCode.toUpperCase()];
  if (!rule) {
    return { isValid: false, cleaned, reason: `Unknown/unsupported country code: "${countryCode}"` };
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

    // 1. order_id
    if (isEmpty(row.order_id)) {
      addError('order_id', 'Order ID is required');
    } else {
      const orderId = safeString(row.order_id);
      if (seenOrderIds.has(orderId)) {
        isDuplicate = true;
        addError('order_id', `Duplicate Order ID: "${orderId}" has already been processed in this file`);
      } else {
        seenOrderIds.add(orderId);
      }
    }

    // 2. customer_name
    if (isEmpty(row.customer_name)) {
      addError('customer_name', 'Customer name is required');
    }

    // 3. country_code
    if (isEmpty(row.country_code)) {
      addError('country_code', 'Country code is required');
    } else {
      const cc = safeString(row.country_code).toUpperCase();
      if (!VALIDATION_CONFIG.phoneRules[cc]) {
        addError('country_code', `Country code "${cc}" is not supported. Supported codes: ${Object.keys(VALIDATION_CONFIG.phoneRules).join(', ')}`);
      }
    }

    // 4. customer_phone
    if (isEmpty(row.customer_phone)) {
      addError('customer_phone', 'Customer phone is required');
    } else if (!isEmpty(row.country_code)) {
      const cc = safeString(row.country_code).toUpperCase();
      if (VALIDATION_CONFIG.phoneRules[cc]) {
        const phoneCheck = validatePhoneNumber(safeString(row.customer_phone), cc);
        if (!phoneCheck.isValid) {
          addError('customer_phone', phoneCheck.reason || 'Invalid phone number format');
        }
      }
    }

    // 5. order_date
    if (isEmpty(row.order_date)) {
      addError('order_date', 'Order date is required');
    } else {
      const dateCheck = parseAndValidateDate(safeString(row.order_date));
      if (!dateCheck.isValid) {
        addError('order_date', dateCheck.reason || 'Invalid date format');
      }
    }

    // 6. order_time
    if (isEmpty(row.order_time)) {
      addError('order_time', 'Order time is required');
    } else {
      if (!validateTime(safeString(row.order_time))) {
        addError('order_time', 'Order time must be in HH:mm or HH:mm:ss 24-hour format');
      }
    }

    // 7. product_id
    if (isEmpty(row.product_id)) {
      addError('product_id', 'Product ID is required');
    }

    // 8. product_name
    if (isEmpty(row.product_name)) {
      addError('product_name', 'Product name is required');
    }

    // 9. quantity
    let qtyNum = 0;
    if (isEmpty(row.quantity)) {
      addError('quantity', 'Quantity is required');
    } else {
      const qtyStr = safeString(row.quantity);
      if (!/^\d+$/.test(qtyStr)) {
        addError('quantity', 'Quantity must be a positive integer (no text or decimals allowed)');
      } else {
        qtyNum = parseInt(qtyStr, 10);
        if (qtyNum <= 0) {
          addError('quantity', 'Quantity must be greater than 0');
        }
      }
    }

    // 10. unit_price
    let priceNum = -1;
    if (isEmpty(row.unit_price)) {
      addError('unit_price', 'Unit price is required');
    } else {
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

    // 11. total_amount
    let totalNum = -1;
    if (isEmpty(row.total_amount)) {
      addError('total_amount', 'Total amount is required');
    } else {
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

    // 12. quantity * unit_price check
    if (qtyNum > 0 && priceNum >= 0 && totalNum >= 0) {
      const calculatedAmount = qtyNum * priceNum;
      const difference = Math.abs(calculatedAmount - totalNum);
      if (difference > VALIDATION_CONFIG.amountTolerance) {
        addError(
          'total_amount',
          `Total amount (${totalNum}) does not match calculated amount (${qtyNum} * ${priceNum} = ${calculatedAmount.toFixed(2)}), exceeds tolerance of ${VALIDATION_CONFIG.amountTolerance}`
        );
      }
    }

    // 13. payment_mode
    if (isEmpty(row.payment_mode)) {
      addError('payment_mode', 'Payment mode is required');
    } else {
      const pm = safeString(row.payment_mode).toUpperCase();
      if (!VALIDATION_CONFIG.allowedPaymentModes.includes(pm)) {
        addError('payment_mode', `Payment mode must be one of: ${VALIDATION_CONFIG.allowedPaymentModes.join(', ')}`);
      }
    }

    // 14. payment_status
    let statusClean = '';
    if (isEmpty(row.payment_status)) {
      addError('payment_status', 'Payment status is required');
    } else {
      statusClean = safeString(row.payment_status).toUpperCase();
      if (!VALIDATION_CONFIG.allowedPaymentStatuses.includes(statusClean)) {
        addError('payment_status', `Payment status must be one of: ${VALIDATION_CONFIG.allowedPaymentStatuses.join(', ')}`);
      }
    }

    // 15. transaction_id
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

    // 16. currency
    if (isEmpty(row.currency)) {
      addError('currency', 'Currency is required');
    } else {
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
