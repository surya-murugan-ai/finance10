# Invoice Itemization in Sales Register

## Overview
This guide explains how to represent individual items within invoices in the sales register, allowing for detailed tracking of products/services sold.

## Current Architecture

### 1. Standardized Transaction Level
Each invoice is stored as a single record in `standardized_transactions` table with:
- `netAmount`: Total invoice amount
- `company`: Customer name
- `particulars`: Invoice description
- `originalRowData`: JSON field containing detailed item breakdown

### 2. Invoice Item Representation

#### Option A: JSON Structure in originalRowData (Recommended)
```json
{
  "invoice_number": "INV-2025-001",
  "invoice_date": "2025-01-15",
  "customer": "Sapience Agribusiness Consulting LLP",
  "total_amount": 167400.00,
  "tax_amount": 30132.00,
  "line_items": [
    {
      "item_code": "PROD-001",
      "description": "Organic Fertilizer - NPK 10:26:26",
      "quantity": 100,
      "unit": "kg",
      "rate": 1200.00,
      "amount": 120000.00,
      "gst_rate": 18,
      "gst_amount": 21600.00,
      "hsn_code": "31051000"
    },
    {
      "item_code": "PROD-002", 
      "description": "Pesticide - Organic Neem Oil",
      "quantity": 50,
      "unit": "ltr",
      "rate": 800.00,
      "amount": 40000.00,
      "gst_rate": 18,
      "gst_amount": 7200.00,
      "hsn_code": "38089390"
    }
  ]
}
```

#### Option B: Separate Invoice Items Table
Create a new table for detailed item tracking:

```sql
-- New table for invoice line items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES standardized_transactions(id),
  item_code VARCHAR(50),
  description TEXT,
  quantity DECIMAL(10,3),
  unit VARCHAR(10),
  rate DECIMAL(15,2),
  amount DECIMAL(15,2),
  gst_rate DECIMAL(5,2),
  gst_amount DECIMAL(15,2),
  hsn_code VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Examples

### 1. Enhanced AI Data Extraction
Update the intelligent data extractor to recognize and parse itemized invoices:

```javascript
// Extract itemized invoice data
const extractInvoiceItems = (excelData) => {
  // AI analyzes structure and extracts:
  // - Invoice header (customer, date, number)
  // - Line items with quantities, rates, amounts
  // - Tax calculations
  // - Total amounts
  
  return {
    header: { customer, date, invoiceNumber, totalAmount },
    items: [
      { code, description, qty, rate, amount, gst },
      // ... more items
    ]
  };
};
```

### 2. Frontend Display Enhancement
Update the data tables to show itemized breakdown:

```typescript
// Show expandable invoice items
const InvoiceItemsView = ({ transaction }) => {
  const items = transaction.originalRowData?.line_items || [];
  
  return (
    <div className="invoice-items">
      <h4>Invoice Items ({items.length})</h4>
      {items.map(item => (
        <div key={item.item_code} className="item-row">
          <span>{item.description}</span>
          <span>{item.quantity} {item.unit}</span>
          <span>₹{item.rate.toLocaleString()}</span>
          <span>₹{item.amount.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};
```

## Benefits of Each Approach

### JSON in originalRowData (Option A)
✅ **Pros:**
- Leverages existing AI extraction system
- Flexible schema for different invoice formats
- No database schema changes needed
- Fast implementation

❌ **Cons:**
- Limited querying capabilities
- No referential integrity
- Complex aggregation queries

### Separate Invoice Items Table (Option B)
✅ **Pros:**
- Proper relational structure
- Easy querying and reporting
- Referential integrity
- Better performance for large datasets

❌ **Cons:**
- Requires database schema changes
- More complex data extraction logic
- Additional table maintenance

## Recommended Implementation

For your current AI-powered system, **Option A (JSON storage)** is recommended because:

1. **AI Integration**: Your existing Claude-powered extraction can easily identify and structure invoice items
2. **Flexibility**: Handles various invoice formats without schema changes
3. **Quick Implementation**: Works with current architecture
4. **Rich Data**: Preserves all original invoice structure and relationships

## Usage Examples

### 1. Sales Register Display
```
Invoice: INV-2025-001 | Customer: Sapience Agribusiness
Total: ₹1,97,532 (incl. GST ₹30,132)
Items: 2 products (100 kg Fertilizer, 50 ltr Pesticide)
```

### 2. Item-wise Sales Analysis
```sql
SELECT 
  item->>'description' as product,
  SUM((item->>'quantity')::decimal) as total_qty,
  SUM((item->>'amount')::decimal) as total_sales
FROM standardized_transactions,
     jsonb_array_elements(original_row_data->'line_items') as item
WHERE category = 'sales'
GROUP BY item->>'description'
ORDER BY total_sales DESC;
```

### 3. GST Reporting by Product
```sql
SELECT 
  item->>'hsn_code' as hsn,
  item->>'gst_rate' as gst_rate,
  SUM((item->>'gst_amount')::decimal) as total_gst
FROM standardized_transactions,
     jsonb_array_elements(original_row_data->'line_items') as item
WHERE category = 'sales'
GROUP BY item->>'hsn_code', item->>'gst_rate';
```

## Next Steps

1. **Enhance AI Extraction**: Update the intelligent data extractor to recognize itemized invoices
2. **Frontend Updates**: Add expandable item views in data tables
3. **Reporting**: Create item-wise sales reports
4. **GST Compliance**: Generate item-wise GST reports for returns

This approach maintains the flexibility of your AI system while providing detailed invoice tracking capabilities.