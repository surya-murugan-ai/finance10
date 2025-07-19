import fs from 'fs';
import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple test to process itemized invoice Excel file
function testItemizedExtraction() {
  const filePath = path.join(__dirname, 'test_data', 'Itemized_Sales_Invoice_Sample.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.log('Itemized invoice file not found at:', filePath);
    return;
  }
  
  console.log('Reading itemized invoice file...');
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });
  
  console.log('File structure:');
  console.log('Total rows:', jsonData.length);
  
  // Show first few rows to understand structure
  for (let i = 0; i < Math.min(8, jsonData.length); i++) {
    console.log(`Row ${i}:`, jsonData[i]);
  }
  
  // Extract headers (should be around row 4)
  const headers = jsonData[4];
  console.log('\nHeaders found:', headers);
  
  // Extract line items starting from row 5
  const lineItems = [];
  for (let i = 5; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length < 5) continue;
    
    const lineItem = {
      company: row[0],
      invoiceNumber: row[1], 
      invoiceDate: row[2],
      itemCode: row[3],
      description: row[4],
      quantity: parseFloat(row[5]) || 0,
      unit: row[6],
      rate: parseFloat(row[7]) || 0,
      amount: parseFloat(row[8]) || 0,
      gstRate: parseFloat(row[9]) || 0,
      gstAmount: parseFloat(row[10]) || 0,
      hsnCode: row[11],
      totalAmount: parseFloat(row[12]) || 0
    };
    
    lineItems.push(lineItem);
  }
  
  console.log(`\nExtracted ${lineItems.length} line items:`);
  
  // Group by invoice
  const invoices = {};
  lineItems.forEach(item => {
    const invoiceKey = `${item.company}-${item.invoiceNumber}`;
    if (!invoices[invoiceKey]) {
      invoices[invoiceKey] = {
        company: item.company,
        invoiceNumber: item.invoiceNumber,
        invoiceDate: item.invoiceDate,
        lineItems: [],
        totalAmount: 0
      };
    }
    invoices[invoiceKey].lineItems.push(item);
    invoices[invoiceKey].totalAmount += item.totalAmount;
  });
  
  // Display itemized invoices
  Object.values(invoices).forEach(invoice => {
    console.log(`\n--- ${invoice.company} - ${invoice.invoiceNumber} ---`);
    console.log(`Date: ${invoice.invoiceDate}`);
    console.log(`Total Amount: ₹${invoice.totalAmount.toLocaleString('en-IN')}`);
    console.log('Line Items:');
    
    invoice.lineItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.description}`);
      console.log(`     Code: ${item.itemCode} | HSN: ${item.hsnCode}`);
      console.log(`     Qty: ${item.quantity} ${item.unit} @ ₹${item.rate}`);
      console.log(`     Amount: ₹${item.amount.toLocaleString('en-IN')} + GST(${item.gstRate}%): ₹${item.gstAmount.toLocaleString('en-IN')}`);
      console.log(`     Total: ₹${item.totalAmount.toLocaleString('en-IN')}`);
    });
  });
  
  const grandTotal = Object.values(invoices).reduce((sum, inv) => sum + inv.totalAmount, 0);
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total Invoices: ${Object.keys(invoices).length}`);
  console.log(`Total Line Items: ${lineItems.length}`);
  console.log(`Grand Total: ₹${grandTotal.toLocaleString('en-IN')}`);
  
  return invoices;
}

// Run the test
testItemizedExtraction();