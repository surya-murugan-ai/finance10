# Invoice Itemization Demo Guide

## Overview
This guide demonstrates how to test and use the enhanced invoice itemization feature that automatically detects and displays line items within sales invoices.

## Enhanced Features

### 1. Date Extraction Improvements
- **Excel Serial Number Support**: Handles Excel date serial numbers automatically
- **Multiple Date Formats**: Supports DD/MM/YYYY, MM/DD/YYYY, and ISO date formats
- **Fallback Date Logic**: Uses document period dates when date extraction fails
- **Indian Date Format Priority**: Assumes DD/MM/YYYY format for Indian business documents

### 2. Enhanced Narration with Item Details
- **Automatic Item Summary**: Itemized invoices show line item details in the narration
- **Product Information**: Displays product codes, descriptions, quantities, and rates
- **Formatted Display**: Professional formatting with quantities, units, and rates
- **Example**: "Sales Invoice INV-2025-001 - Items: Organic Fertilizer NPK 10:26:26 50 kg @₹1200; Neem Oil Pesticide 25 ltr @₹800"

### 3. Comprehensive Column Mapping
Enhanced fallback column detection includes:
- **Date Fields**: date, dt, transaction.date
- **Company Fields**: company, party, name, customer, vendor, supplier
- **Description Fields**: particulars, description, narration, details, item
- **Amount Fields**: amount, value, total, net.amount, gross.total
- **Item Details**: quantity, rate, item.code, hsn.code, gst.rate, gst.amount

## Testing the Features

### Method 1: Using Test Data Endpoint
Access the test endpoint to see itemized invoice examples:
```
GET /api/test-itemized-data
```

This returns sample itemized invoices with:
- Detailed line items for agricultural products
- GST calculations per item
- HSN codes for Indian compliance
- Quantity, rate, and unit information

### Method 2: Upload Sample Excel Files
Create Excel files with itemized structure:

```
| Date       | Company              | Invoice No | Item Code    | Description           | Qty | Unit | Rate | Amount  | GST Rate | GST Amount | HSN Code |
|------------|----------------------|------------|--------------|----------------------|-----|------|------|---------|----------|------------|----------|
| 15/04/2025 | Sapience Agribusiness| INV-001    | FERT-NPK-001 | Organic Fertilizer   | 50  | kg   | 1200 | 60000   | 18       | 10800      | 31051000 |
| 15/04/2025 | Sapience Agribusiness| INV-001    | PEST-NEEM-002| Neem Oil Pesticide   | 25  | ltr  | 800  | 20000   | 18       | 3600       | 38089390 |
```

### Method 3: View in Data Tables
1. Navigate to Data Tables page
2. Select "Sales Register" tab
3. Look for transactions with expandable row icons
4. Click to expand and view line item details

## Expected Results

### Date Extraction
- Transactions should show correct dates from Excel files
- Date format should be properly parsed from Indian DD/MM/YYYY format
- Fallback dates should appear when extraction fails

### Enhanced Narration
- Non-itemized transactions: Standard narration (e.g., "Bengal Animal Health & Nutrition Solutions Pvt Ltd")
- Itemized transactions: Enhanced narration with item details (e.g., "Sales Invoice INV-2025-001 - Items: Organic Fertilizer NPK 10:26:26 50 kg @₹1200; Neem Oil Pesticide 25 ltr @₹800")

### Expandable Rows
- Itemized invoices display with expand/collapse icons
- Expanded view shows professional grid of line items
- Each line item shows: Item Code, Description, Quantity, Unit, Rate, Amount, GST Rate, GST Amount, HSN Code

## Technical Implementation

### Key Files Modified
1. **server/services/intelligentDataExtractor.ts**
   - Enhanced date parsing with multiple format support
   - Improved narration with itemized details
   - Comprehensive column mapping patterns

2. **server/routes.ts**
   - Added `/api/test-itemized-data` endpoint for demonstration
   - Test data includes realistic Indian business scenarios

### Data Structure
Each itemized transaction includes:
```typescript
{
  transactionDate: Date,
  company: string,
  particulars: string, // Enhanced with item details
  invoiceItems: InvoiceItem[], // Array of line items
  isItemized: boolean
}
```

### Line Item Structure
```typescript
{
  itemCode: string,
  description: string,
  quantity: number,
  unit: string,
  rate: number,
  amount: number,
  gstRate: number,
  gstAmount: number,
  hsnCode: string
}
```

## Production Usage

### For Real Invoice Processing
1. Upload Excel files with itemized invoice data
2. System automatically detects itemization patterns
3. AI extracts line item details during processing
4. Enhanced narration includes item summaries
5. Expandable UI shows detailed line items

### For Compliance Requirements
- HSN codes tracked per line item
- GST calculations maintained per item
- Quantity and unit information preserved
- Item codes available for inventory tracking

## Troubleshooting

### Date Not Extracting
- Check Excel date format (DD/MM/YYYY preferred)
- Verify date column headers match patterns
- System will use fallback dates from document period

### Narration Missing Item Details
- Ensure invoice has multiple line items
- Check for quantity, rate, and description columns
- Verify itemization detection patterns

### Items Not Expanding
- Confirm `isItemized` field is true
- Check `invoiceItems` array has data
- Verify React component rendering

This enhanced system provides comprehensive invoice itemization with improved date handling and detailed narration for better financial tracking and compliance.