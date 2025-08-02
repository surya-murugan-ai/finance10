import XLSX from 'xlsx';
import fs from 'fs';

// Get the most recent uploaded file to debug
const filePath = 'uploads/e3743b35f22bfabef364b940a679d11a'; // Latest sales register file

console.log('=== DEBUGGING FILE EXTRACTION ===');
console.log('File path:', filePath);

if (!fs.existsSync(filePath)) {
  console.log('File does not exist!');
  process.exit(1);
}

try {
  // Read Excel file
  const workbook = XLSX.readFile(filePath);
  console.log('Sheet names:', workbook.SheetNames);
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with raw values
  const rawData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, 
    raw: false, 
    defval: '' 
  });
  
  console.log('Total rows:', rawData.length);
  console.log('First 10 rows:');
  
  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const row = rawData[i];
    console.log(`Row ${i}:`, row);
  }
  
  // Look for header patterns
  console.log('\n=== LOOKING FOR HEADERS ===');
  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const row = rawData[i];
    if (row && row.length > 3) {
      const rowText = row.join(' ').toLowerCase();
      if (rowText.includes('date') || 
          rowText.includes('particulars') || 
          rowText.includes('amount') ||
          rowText.includes('voucher') ||
          rowText.includes('company') ||
          rowText.includes('transaction')) {
        console.log(`POTENTIAL HEADER at row ${i}:`, row);
      }
    }
  }
  
} catch (error) {
  console.error('Error processing file:', error);
}