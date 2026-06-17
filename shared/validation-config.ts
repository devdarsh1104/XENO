export interface PhoneRule {
  minDigits: number;
  maxDigits: number;
  countryName: string;
}

export interface ValidationRules {
  allowedPaymentModes: string[];
  allowedPaymentStatuses: string[];
  phoneRules: Record<string, PhoneRule>;
  allowedDateFormats: string[];
  allowedTimeFormats: string[];
  amountTolerance: number;
  maxFileSize: number; // in bytes
}

export const VALIDATION_CONFIG: ValidationRules = {
  allowedPaymentModes: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET'],
  allowedPaymentStatuses: ['PAID', 'PENDING', 'FAILED', 'REFUNDED'],
  phoneRules: {
    SG: { minDigits: 8, maxDigits: 8, countryName: 'Singapore' },
    IN: { minDigits: 10, maxDigits: 10, countryName: 'India' },
    US: { minDigits: 10, maxDigits: 10, countryName: 'United States' },
    UK: { minDigits: 10, maxDigits: 11, countryName: 'United Kingdom' }
  },
  allowedDateFormats: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'],
  allowedTimeFormats: ['HH:mm', 'HH:mm:ss'],
  amountTolerance: 0.01,
  maxFileSize: 10 * 1024 * 1024 // 10MB
};
