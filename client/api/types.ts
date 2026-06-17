export interface TransactionRow {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  country_code: string;
  order_date: string;
  order_time: string;
  product_id: string;
  product_name: string;
  quantity: string;
  unit_price: string;
  total_amount: string;
  payment_mode: string;
  currency: string;
  transaction_id: string;
  payment_status: string;
  [key: string]: string; // Fallback for extra fields or indexing
}

export interface ValidationError {
  row: number; // 1-indexed line number in CSV (row 1 is data row after header)
  field: string;
  value: string;
  reason: string;
}

export interface RowValidationResult {
  rowNumber: number;
  isValid: boolean;
  isDuplicate: boolean;
  data: TransactionRow;
  errors: ValidationError[];
}

export interface ValidationSummary {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateRowsCount: number;
  errorsByField: Record<string, number>;
  invalidRowsPreview: { rowNumber: number; data: TransactionRow; errors: ValidationError[] }[];
  validRowsPreview: TransactionRow[];
  sessionId: string;
}
