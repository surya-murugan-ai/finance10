// Test script to force generation of new journal entries with AI narration
const fs = require('fs');
const path = require('path');

// Create a simple test CSV file for AI narration testing
const testData = `Date,Company,Particulars,Amount,Type
2025-07-19,Quest Agrovet Services Pvt Ltd,Sale of agricultural equipment to customer,50000,sales_register
2025-07-19,Sapience Agribusiness Consulting LLP,Consulting services for crop management,25000,vendor_invoice`;

// Write test file
const testFilePath = path.join(__dirname, 'uploads', 'ai_narration_test.csv');
fs.writeFileSync(testFilePath, testData);

console.log('Created test file:', testFilePath);
console.log('File contents:');
console.log(testData);