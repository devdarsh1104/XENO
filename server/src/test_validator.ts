import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { validateTransactions } from './validator';
import { TransactionRow } from './types';

function runTests() {
  console.log('--- Starting Validator Engine Tests ---');
  
  const samplePath = path.join(__dirname, '../../sample_transactions.csv');
  if (!fs.existsSync(samplePath)) {
    console.error(`FAIL: Sample file not found at ${samplePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(samplePath, 'utf8');
  const parseResult = Papa.parse<TransactionRow>(fileContent, {
    header: true,
    skipEmptyLines: 'greedy'
  });

  const rows = parseResult.data;
  console.log(`Loaded ${rows.length} rows from sample dataset.`);

  const results = validateTransactions(rows);
  const validRows = results.filter(r => r.isValid);
  const invalidRows = results.filter(r => !r.isValid);
  const duplicates = results.filter(r => r.isDuplicate);

  console.log('\n--- Test Metrics Summary ---');
  console.log(`Total Rows Analyzed: ${results.length}`);
  console.log(`Valid Rows Count:   ${validRows.length}`);
  console.log(`Invalid Rows Count: ${invalidRows.length}`);
  console.log(`Duplicate Rows:     ${duplicates.length}`);

  // Field error accumulation
  const errorFields: Record<string, number> = {};
  invalidRows.forEach(res => {
    res.errors.forEach(e => {
      errorFields[e.field] = (errorFields[e.field] || 0) + 1;
    });
  });

  console.log('\nErrors by Field:');
  console.log(JSON.stringify(errorFields, null, 2));

  // Let's print invalid rows and their errors
  console.log('\n--- Detailed Row Errors Breakdown ---');
  invalidRows.forEach(res => {
    console.log(`Row #${res.rowNumber} | Order ID: ${res.data.order_id || '(missing)'} | Customer: ${res.data.customer_name || '(missing)'}`);
    res.errors.forEach(e => {
      console.log(`   └─ Field: "${e.field}" | Value: "${e.value}" | Reason: ${e.reason}`);
    });
  });

  // Simple assertions to ensure validator works as expected
  console.log('\n--- Executing Assertions ---');
  let failures = 0;

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failures++;
    }
  };

  // Row 1: ORD001 (John Doe) should be valid
  assert(results[0].isValid === true, 'Row 1 (ORD001 - John Doe) is completely valid');

  // Row 2: ORD002 (Jane Smith) should be valid
  assert(results[1].isValid === true, 'Row 2 (ORD002 - Jane Smith) is completely valid');

  // Row 3: ORD003 (Bob Johnson) has pending status but no transaction_id. Should be valid (txn_id is only required when PAID)
  assert(results[2].isValid === true, 'Row 3 (ORD003 - Bob Johnson - PENDING status without transaction_id) is valid');

  // Row 5: ORD005 has phone length 5 (digits-only) for US, which is invalid (should be 10 digits)
  assert(results[4].isValid === false, 'Row 5 (ORD005 - US phone "12345") is flagged as invalid phone size');

  // Row 6: ORD006 has date 2026-02-31 (calendar invalid)
  assert(results[5].isValid === false, 'Row 6 (ORD006 - Invalid date "2026-02-31") is flagged');

  // Row 7: ORD007 has amount mismatch (100.00 vs 120.00)
  assert(results[6].isValid === false, 'Row 7 (ORD007 - Mismatch calculated price and total_amount) is flagged');

  // Row 8: ORD008 has empty customer_name
  assert(results[7].isValid === false, 'Row 8 (ORD008 - Empty customer_name) is flagged');

  // Row 10: ORD001 Duplicate Order is duplicate of row 1
  assert(results[9].isValid === false && results[9].isDuplicate === true, 'Row 10 (ORD001 - duplicate order ID) is flagged as duplicate');

  // Row 11: ORD011 (Grace Lee) has phone "8888-9999" (cleaned to "88889999") which is valid for SG (8 digits)
  assert(results[10].isValid === true, 'Row 11 (ORD011 - SG phone "8888-9999" cleans to 8 digits) is valid');

  // Row 12: ORD012 has invalid time "25:00:00"
  assert(results[11].isValid === false, 'Row 12 (ORD012 - Invalid time "25:00:00") is flagged');

  // Row 14: ORD014 has payment status PAID but no transaction_id
  assert(results[13].isValid === false, 'Row 14 (ORD014 - PAID status with empty transaction_id) is flagged');

  // Row 15: ORD015 has payment status COMPLETED (not in our PAID, PENDING, FAILED, REFUNDED list)
  assert(results[14].isValid === false, 'Row 15 (ORD015 - Invalid payment status "COMPLETED") is flagged');

  // Row 17: ORD017 has duplicate transaction_id (TXN5016, same as row 16)
  assert(results[16].isValid === false && results[16].isDuplicate === true, 'Row 17 (ORD017 - Duplicate transaction_id "TXN5016") is flagged');

  // Row 20: ORD020 has country FR (unsupported country code)
  assert(results[19].isValid === false, 'Row 20 (ORD020 - Unsupported country code "FR") is flagged');

  // Row 22: ORD022 has unit_price "abc" (non-numeric)
  assert(results[21].isValid === false, 'Row 22 (ORD022 - Non-numeric unit price "abc") is flagged');

  if (failures > 0) {
    console.error(`\n❌ Validation tests finished with ${failures} failure(s).`);
    process.exit(1);
  } else {
    console.log('\n🎉 All validator tests passed successfully!');
  }
}

runTests();
