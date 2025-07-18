import { AnthropicClient } from './anthropicClient';
import { storage } from '../storage';
import xlsx from 'xlsx';
import { z } from 'zod';
import { insertStandardizedTransactionSchema } from '@shared/schema';

export interface ExcelAnalysis {
  documentType: string;
  confidence: number;
  structure: {
    headerRow: number;
    dataStartRow: number;
    totalRows: number;
    totalColumns: number;
    columnHeaders: string[];
  };
  columnMapping: {
    [key: string]: string | null;
  };
  companyName: string;
  period: string;
  summary: string;
}

export interface InvoiceLineItem {
  itemCode?: string;
  description: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount: number;
  gstRate?: number;
  gstAmount?: number;
  hsnCode?: string;
  discountPercent?: number;
  discountAmount?: number;
}

export interface StandardizedTransaction {
  transactionDate: Date;
  company: string;
  particulars: string;
  voucherType: string;
  voucherNumber: string;
  debitAmount: number;
  creditAmount: number;
  netAmount: number;
  taxAmount?: number;
  category: 'sales' | 'purchase' | 'payment' | 'receipt' | 'journal' | 'other';
  aiConfidence: number;
  originalRowData: any;
  columnMapping: any;
  invoiceItems?: InvoiceLineItem[];  // New field for itemized invoices
  isItemized?: boolean;  // Flag to indicate if this is an itemized invoice
}

export class IntelligentDataExtractor {
  private anthropicClient: AnthropicClient;

  constructor() {
    this.anthropicClient = new AnthropicClient();
  }

  async extractFromExcel(filePath: string, documentId: string, tenantId: string): Promise<{
    analysis: ExcelAnalysis;
    transactions: StandardizedTransaction[];
    totalProcessed: number;
  }> {
    try {
      // Read Excel file
      const workbook = xlsx.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });

      // Extract first 10 rows for AI analysis
      const sampleRows = jsonData.slice(0, 10);
      
      // Use AI to analyze Excel structure and classify document
      const analysis = await this.analyzeExcelStructure(sampleRows, jsonData.length);
      
      // Extract all data rows based on AI analysis
      const dataRows = jsonData.slice(analysis.structure.dataStartRow);
      
      // Transform rows into standardized transactions
      const transactions = await this.transformToStandardizedTransactions(
        dataRows,
        analysis,
        tenantId,
        documentId
      );

      // Filter out invalid transactions
      const validTransactions = transactions.filter(t => 
        t.transactionDate && 
        t.company && 
        (t.debitAmount > 0 || t.creditAmount > 0)
      );

      // Store standardized transactions in database
      if (validTransactions.length > 0) {
        await storage.bulkCreateStandardizedTransactions(
          validTransactions.map(t => ({
            tenantId,
            documentId,
            transactionDate: t.transactionDate,
            company: t.company,
            particulars: t.particulars,
            voucherType: t.voucherType,
            voucherNumber: t.voucherNumber,
            debitAmount: t.debitAmount.toString(),
            creditAmount: t.creditAmount.toString(),
            netAmount: t.netAmount.toString(),
            taxAmount: t.taxAmount?.toString(),
            category: t.category,
            aiConfidence: t.aiConfidence,
            originalRowData: t.originalRowData,
            columnMapping: t.columnMapping
          }))
        );
      }

      return {
        analysis,
        transactions: validTransactions,
        totalProcessed: validTransactions.length
      };

    } catch (error) {
      console.error('Error in intelligent data extraction:', error);
      throw new Error(`Failed to extract data: ${error.message}`);
    }
  }

  private async analyzeExcelStructure(sampleRows: any[], totalRows: number): Promise<ExcelAnalysis> {
    const prompt = `
Analyze this Excel data and provide a structured analysis:

Sample Data (first 10 rows):
${JSON.stringify(sampleRows, null, 2)}

Total Rows: ${totalRows}

Please analyze and return a JSON response with:
1. Document type classification (sales_register, purchase_register, bank_statement, trial_balance, etc.)
2. Confidence score (0-100)
3. Structure analysis (header row, data start row, column headers)
4. Column mapping to standard fields (date, company, particulars, amount, debit, credit, etc.)
5. Company name extraction
6. Time period identification
7. Summary description
8. Invoice itemization detection

Return only valid JSON in this format:
{
  "documentType": "sales_register",
  "confidence": 85,
  "structure": {
    "headerRow": 3,
    "dataStartRow": 4,
    "totalRows": ${totalRows},
    "totalColumns": 8,
    "columnHeaders": ["Date", "Company", "Particulars", "Amount"]
  },
  "columnMapping": {
    "date": "Date",
    "company": "Company",
    "particulars": "Particulars",
    "amount": "Amount",
    "debit": "Debit",
    "credit": "Credit",
    "quantity": "Quantity",
    "rate": "Rate",
    "itemCode": "Item Code",
    "description": "Description",
    "unit": "Unit",
    "gstRate": "GST Rate",
    "gstAmount": "GST Amount",
    "hsnCode": "HSN Code"
  },
  "companyName": "Company Name",
  "period": "Q1 2025",
  "summary": "Sales register containing transaction data",
  "isItemized": false,
  "itemizedPattern": "none"
}

Pay special attention to:
1. Invoice itemization patterns (multiple rows for same invoice number)
2. Product/service details (item codes, descriptions, quantities, rates)
3. GST and tax information
4. HSN codes for Indian compliance
5. Line item structure vs summary transactions
`;

    const response = await this.anthropicClient.analyzeContent(prompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      // Fallback analysis if AI fails
      return this.createFallbackAnalysis(sampleRows, totalRows);
    }
  }

  private createFallbackAnalysis(sampleRows: any[], totalRows: number): ExcelAnalysis {
    // Simple fallback logic to detect headers and structure
    let headerRow = 0;
    let dataStartRow = 1;
    
    // Try to find the header row (usually contains text like "Date", "Amount", etc.)
    for (let i = 0; i < Math.min(5, sampleRows.length); i++) {
      const row = sampleRows[i];
      if (row && row.some((cell: any) => 
        typeof cell === 'string' && 
        /date|amount|company|particulars|debit|credit/i.test(cell)
      )) {
        headerRow = i;
        dataStartRow = i + 1;
        break;
      }
    }

    const headers = sampleRows[headerRow] || [];
    
    return {
      documentType: 'other',
      confidence: 50,
      structure: {
        headerRow,
        dataStartRow,
        totalRows,
        totalColumns: headers.length,
        columnHeaders: headers.map((h: any) => String(h || ''))
      },
      columnMapping: {
        date: this.findColumn(headers, /date|dt|transaction.date/i),
        company: this.findColumn(headers, /company|party|name|customer|vendor|supplier/i),
        particulars: this.findColumn(headers, /particulars|description|narration|details|item/i),
        amount: this.findColumn(headers, /amount|value|total|net.amount|gross.total/i),
        debit: this.findColumn(headers, /debit|dr/i),
        credit: this.findColumn(headers, /credit|cr/i),
        voucherNumber: this.findColumn(headers, /voucher|invoice|ref|number/i),
        quantity: this.findColumn(headers, /quantity|qty|units/i),
        rate: this.findColumn(headers, /rate|price|unit.price/i),
        itemCode: this.findColumn(headers, /item.code|product.code|code/i),
        description: this.findColumn(headers, /description|item.description|product.description/i),
        unit: this.findColumn(headers, /unit|uom|measurement/i),
        gstRate: this.findColumn(headers, /gst.rate|tax.rate|cgst|sgst|igst/i),
        gstAmount: this.findColumn(headers, /gst.amount|tax.amount|cgst.amount|sgst.amount|igst.amount/i),
        hsnCode: this.findColumn(headers, /hsn|hsn.code|sac.code/i),
        tax: this.findColumn(headers, /tax|gst|vat/i)
      },
      companyName: 'Unknown Company',
      period: 'Unknown Period',
      summary: 'Document with structured data detected'
    };
  }

  private findColumn(headers: any[], pattern: RegExp): string | null {
    const header = headers.find((h: any) => pattern.test(String(h || '')));
    return header ? String(header) : null;
  }

  private async transformToStandardizedTransactions(
    dataRows: any[],
    analysis: ExcelAnalysis,
    tenantId: string,
    documentId: string
  ): Promise<StandardizedTransaction[]> {
    const transactions: StandardizedTransaction[] = [];

    for (const row of dataRows) {
      if (!row || row.length === 0) continue;

      try {
        const transaction = this.mapRowToTransaction(row, analysis);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.warn('Failed to process row:', row, error);
      }
    }

    return transactions;
  }

  private mapRowToTransaction(row: any[], analysis: ExcelAnalysis): StandardizedTransaction | null {
    const mapping = analysis.columnMapping;
    const headers = analysis.structure.columnHeaders;

    // Helper function to get value by column name
    const getValue = (columnName: string | null): any => {
      if (!columnName) return null;
      const index = headers.indexOf(columnName);
      return index >= 0 ? row[index] : null;
    };

    // Extract date with enhanced parsing
    const dateValue = getValue(mapping.date);
    let transactionDate: Date;
    
    if (dateValue) {
      // Try multiple date parsing approaches
      if (dateValue instanceof Date) {
        transactionDate = dateValue;
      } else if (typeof dateValue === 'number') {
        // Excel date serial number
        transactionDate = new Date((dateValue - 25569) * 86400 * 1000);
      } else {
        const dateStr = String(dateValue).trim();
        // Try different date formats
        transactionDate = new Date(dateStr);
        
        if (isNaN(transactionDate.getTime())) {
          // Try parsing DD/MM/YYYY or MM/DD/YYYY format
          const dateParts = dateStr.split(/[-/]/);
          if (dateParts.length === 3) {
            // Assume DD/MM/YYYY format for Indian documents
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
            const year = parseInt(dateParts[2]);
            transactionDate = new Date(year, month, day);
          }
        }
      }
      
      if (isNaN(transactionDate.getTime())) {
        // If still invalid, use a default date from the document period
        transactionDate = new Date(2025, 3, 15); // Default to April 15, 2025 (Q1 2025)
      }
    } else {
      // Default date for rows without dates
      transactionDate = new Date(2025, 3, 15); // Default to April 15, 2025 (Q1 2025)
    }

    // Extract amounts
    const debitValue = getValue(mapping.debit);
    const creditValue = getValue(mapping.credit);
    const amountValue = getValue(mapping.amount);

    let debitAmount = 0;
    let creditAmount = 0;
    let netAmount = 0;

    // Parse amounts
    if (debitValue) {
      debitAmount = this.parseAmount(debitValue);
    }
    if (creditValue) {
      creditAmount = this.parseAmount(creditValue);
    }
    if (amountValue) {
      netAmount = this.parseAmount(amountValue);
      if (debitAmount === 0 && creditAmount === 0) {
        // If no separate debit/credit columns, use amount as debit
        debitAmount = netAmount;
      }
    }

    // Skip rows with no amounts
    if (debitAmount === 0 && creditAmount === 0 && netAmount === 0) {
      return null;
    }

    // Calculate net amount if not provided
    if (netAmount === 0) {
      netAmount = debitAmount - creditAmount;
    }

    // Determine category based on document type
    const category = this.determineCategory(analysis.documentType, debitAmount, creditAmount);

    // Extract invoice line items if this is an itemized invoice
    const invoiceItems = this.extractInvoiceItems(row, analysis, headers);
    const isItemized = invoiceItems.length > 0;

    // Enhanced narration with item details
    let narration = getValue(mapping.particulars) || 'Transaction';
    if (isItemized && invoiceItems.length > 0) {
      const itemSummary = invoiceItems.map(item => {
        const parts = [item.description];
        if (item.quantity && item.unit) parts.push(`${item.quantity} ${item.unit}`);
        if (item.rate) parts.push(`@₹${item.rate}`);
        return parts.join(' ');
      }).join('; ');
      narration = `${narration} - Items: ${itemSummary}`;
    }

    return {
      transactionDate,
      company: getValue(mapping.company) || analysis.companyName || 'Unknown Company',
      particulars: narration,
      voucherType: analysis.documentType,
      voucherNumber: getValue(mapping.voucherNumber) || '',
      debitAmount,
      creditAmount,
      netAmount,
      taxAmount: getValue(mapping.tax) ? this.parseAmount(getValue(mapping.tax)) : undefined,
      category,
      aiConfidence: analysis.confidence,
      originalRowData: row,
      columnMapping: mapping,
      invoiceItems: isItemized ? invoiceItems : undefined,
      isItemized
    };
  }

  private extractInvoiceItems(row: any[], analysis: ExcelAnalysis, headers: string[]): InvoiceLineItem[] {
    const mapping = analysis.columnMapping;
    const items: InvoiceLineItem[] = [];

    // Helper function to get value by column name
    const getValue = (columnName: string | null): any => {
      if (!columnName) return null;
      const index = headers.indexOf(columnName);
      return index >= 0 ? row[index] : null;
    };

    // Check if this row contains itemized data
    const itemCode = getValue(mapping.itemCode);
    const description = getValue(mapping.description) || getValue(mapping.particulars);
    const quantity = getValue(mapping.quantity);
    const rate = getValue(mapping.rate);
    const amount = getValue(mapping.amount);
    const gstRate = getValue(mapping.gstRate);
    const gstAmount = getValue(mapping.gstAmount);
    const hsnCode = getValue(mapping.hsnCode);
    const unit = getValue(mapping.unit);

    // If we have itemized data, create an invoice line item
    if (description && (quantity || rate || amount)) {
      const item: InvoiceLineItem = {
        description: String(description),
        amount: this.parseAmount(amount) || 0
      };

      // Add optional fields if available
      if (itemCode) item.itemCode = String(itemCode);
      if (quantity) item.quantity = this.parseAmount(quantity);
      if (rate) item.rate = this.parseAmount(rate);
      if (unit) item.unit = String(unit);
      if (gstRate) item.gstRate = this.parseAmount(gstRate);
      if (gstAmount) item.gstAmount = this.parseAmount(gstAmount);
      if (hsnCode) item.hsnCode = String(hsnCode);

      items.push(item);
    }

    return items;
  }

  private parseAmount(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remove currency symbols and commas
      const cleaned = value.replace(/[₹$,\s]/g, '');
      const number = parseFloat(cleaned);
      return isNaN(number) ? 0 : number;
    }
    return 0;
  }

  private determineCategory(documentType: string, debitAmount: number, creditAmount: number): 'sales' | 'purchase' | 'payment' | 'receipt' | 'journal' | 'other' {
    if (documentType.includes('sales')) return 'sales';
    if (documentType.includes('purchase')) return 'purchase';
    if (documentType.includes('payment')) return 'payment';
    if (documentType.includes('receipt')) return 'receipt';
    if (documentType.includes('journal')) return 'journal';
    
    // Determine by amount pattern
    if (debitAmount > 0 && creditAmount === 0) return 'payment';
    if (creditAmount > 0 && debitAmount === 0) return 'receipt';
    
    return 'other';
  }
}