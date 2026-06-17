const fs = require('fs');
const archiver = require('archiver');
const Papa = require('papaparse');

const validRows = [{ a: 1, b: 2 }, { a: 3, b: 4 }];
const csv = Papa.unparse(validRows);
fs.writeFileSync('test.csv', csv);

const output = fs.createWriteStream('test.zip');
const archive = archiver('zip', { zlib: { level: 9 } });
output.on('close', () => console.log('Zip closed, size:', archive.pointer()));
archive.on('error', (err) => console.error(err));
archive.pipe(output);
archive.file('test.csv', { name: 'test.csv' });
archive.finalize();
