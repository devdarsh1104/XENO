import Papa from 'papaparse';
import fs from 'fs';
const csv = fs.readFileSync('../sample_transactions.csv', 'utf8');
Papa.parse(csv, {
  header: true,
  skipEmptyLines: 'greedy',
  transformHeader: (header) => header.trim().replace(/^\uFEFF/, ''),
  transform: (value) => (typeof value === 'string' ? value.trim() : value),
  complete: (results) => {
    console.log("Parsed rows:", results.data.length);
    if(results.data.length > 0) {
      console.log("First row keys:", Object.keys(results.data[0]));
      console.log("First row customer_phone:", results.data[0].customer_phone);
    }
  }
});
