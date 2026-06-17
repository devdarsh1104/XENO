const Papa = require('papaparse');
const validRows = [{ a: 1, b: 2 }, { a: 3, b: 4 }];
const headers = ['a', 'b'];
console.log("With fields array:", Papa.unparse({ fields: headers, data: validRows }));
console.log("Without fields array:", Papa.unparse(validRows));
