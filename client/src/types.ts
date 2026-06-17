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
  [key: string]: string;
}

export interface ValidationError {
  row: number;
  field: string;
  value: string;
  reason: string;
}

export interface InvalidRowPreview {
  rowNumber: number;
  errors: ValidationError[];
  data: TransactionRow;
}

export interface ValidationSummary {
  sessionId: string;
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateRowsCount: number;
  errorsByField: Record<string, number>;
  invalidRowsPreview: InvalidRowPreview[];
  validRowsPreview: TransactionRow[];
  chunkCount: number;
}
