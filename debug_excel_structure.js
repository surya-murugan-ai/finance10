import XLSX from 'xlsx';
import fs from 'fs';

// Debug the actual Excel file structure
const filePath = './uploads/IuWk6vDxAoT4BG1hLPrs1_sales_register.xlsx';

if (fs.existsSync(filePath)) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get first 10 rows to understand structure
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 10 });
    
    console.log('=== EXCEL FILE STRUCTURE ===');
    console.log('File:', filePath);
    console.log('Sheet Name:', sheetName);
    console.log('First 10 rows:');
    
    jsonData.forEach((row, index) => {
      console.log(`Row ${index}:`, row);
    });
    
    // Also get the full data without header restriction
    const fullData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('\n=== SUMMARY ===');
    console.log('Total rows:', fullData.length);
    console.log('Non-empty rows:', fullData.filter(row => row && row.length > 0).length);
    
  } catch (error) {
    console.error('Error reading Excel file:', error);
  }
} else {
  console.log('File not found:', filePath);
}