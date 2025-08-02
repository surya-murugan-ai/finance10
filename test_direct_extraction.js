import XLSX from 'xlsx';

const filePath = 'uploads/e3743b35f22bfabef364b940a679d11a';
const documentType = 'sales_register';

console.log('=== TESTING DIRECT EXTRACTION LOGIC ===');

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const rawData = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1, 
  raw: false, 
  defval: '' 
});

// Find header row
let headerRowIndex = -1;
for (let i = 0; i < Math.min(rawData.length, 10); i++) {
  const row = rawData[i];
  if (row && row.length > 3) {
    const rowText = row.join(' ').toLowerCase();
    if (rowText.includes('date') || 
        rowText.includes('particulars') || 
        rowText.includes('amount')) {
      headerRowIndex = i;
      console.log(`Found header row at index ${i}: ${row.slice(0, 5).join(', ')}`);
      break;
    }
  }
}

if (headerRowIndex >= 0) {
  const headers = rawData[headerRowIndex];
  const dataRows = rawData.slice(headerRowIndex + 1);
  const data = [];
  
  console.log(`Processing ${dataRows.length} data rows...`);
  
  for (let i = 0; i < Math.min(dataRows.length, 10); i++) {
    const row = dataRows[i];
    
    // Skip empty rows
    if (!row || row.length === 0 || !row[0]) {
      continue;
    }
    
    const entry = {
      rowNumber: i + 1,
      date: row[0] || '',
      particulars: row[1] || '',
      voucherType: row[2] || '',
      voucherNumber: row[3] || '',
      narration: row[4] || '',
      value: row[5] || '',
      grossTotal: row[6] || ''
    };
    
    // Extract amount
    let amountSource = entry.value || entry.grossTotal;
    if (amountSource) {
      const valueStr = amountSource.toString();
      const numericMatch = valueStr.match(/([0-9,]+\.?[0-9]*)/);
      if (numericMatch) {
        const numericValue = parseFloat(numericMatch[1].replace(/,/g, ''));
        if (!isNaN(numericValue) && numericValue > 0) {
          entry.amount = numericValue;
          entry.formattedAmount = `₹${numericValue.toLocaleString('en-IN')}`;
        }
      }
    }
    
    // Clean company name
    if (entry.particulars) {
      entry.company = entry.particulars.toString().trim();
    }
    
    // Format date
    if (entry.date) {
      entry.transactionDate = entry.date.toString().trim();
    }
    
    console.log(`Row ${i+1}: Company="${entry.company}", Amount=${entry.amount}, Date="${entry.transactionDate}"`);
    
    // Check validation
    if (entry.company && entry.amount) {
      data.push(entry);
      console.log(`✓ VALID: Added entry for ${entry.company} - ₹${entry.amount}`);
    } else {
      console.log(`✗ INVALID: Skipped - Company: "${entry.company}", Amount: ${entry.amount}`);
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total valid entries extracted: ${data.length}`);
  console.log(`Sample valid entry:`, data[0]);
  
} else {
  console.log('Header row not found!');
}