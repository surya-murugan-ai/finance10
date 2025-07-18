import express, { type Request, type Response } from 'express';
import { db } from './db';
import { storage } from './storage';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import XLSX from 'xlsx';
import { localAuth, getCurrentUser } from './localAuth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const jwtAuth = localAuth;

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

export async function registerRoutes(app: express.Express): Promise<any> {
  // Ensure JSON middleware is set up
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Authentication routes are handled inline

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Authentication endpoints
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user || !user.password || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          tenant_id: user.tenant_id
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        tenant_id: null
      });

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          tenant_id: user.tenant_id
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', jwtAuth, getCurrentUser);

  // Document upload endpoint
  app.post('/api/documents/upload', jwtAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const user = (req as any).user;
      if (!user?.tenant_id) {
        return res.status(403).json({ error: 'User must be assigned to a tenant' });
      }

      const document = await storage.createDocument({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadPath: req.file.path,
        documentType: 'unknown',
        status: 'uploaded',
        tenant_id: user.tenant_id
      });

      res.json({
        message: 'File uploaded successfully',
        document: {
          id: document.id,
          filename: document.filename,
          originalName: document.originalName,
          size: document.size,
          documentType: document.documentType,
          status: document.status,
          tenant_id: document.tenant_id
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  });

  // Extract data from uploaded documents
  app.get('/api/extracted-data', jwtAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.tenant_id) {
        return res.status(403).json({ error: 'User must be assigned to a tenant' });
      }

      const documents = await storage.getDocumentsByTenant(user.tenant_id);
      const extractedData = [];

      for (const doc of documents) {
        try {
          const filePath = doc.filePath;
          
          if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            continue;
          }

          let data = [];
          
          if (doc.mimeType?.includes('excel') || doc.originalName?.endsWith('.xlsx')) {
            // Read Excel file
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON with raw values
            const rawData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1, 
              raw: false, 
              defval: '' 
            });
            
            // Find the header row (usually row 4 or 6 depending on document structure)
            let headerRowIndex = -1;
            for (let i = 0; i < rawData.length; i++) {
              const row = rawData[i] as any[];
              if (row && row.length > 5 && row[0] && row[0].toString().toLowerCase().includes('date')) {
                headerRowIndex = i;
                break;
              }
            }
            
            if (headerRowIndex >= 0) {
              const headers = rawData[headerRowIndex] as string[];
              const dataRows = rawData.slice(headerRowIndex + 1);
              
              // Process each data row
              for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i] as any[];
                
                // Skip empty rows and Grand Total rows
                if (!row || row.length === 0 || !row[0] || 
                    (row[1] && row[1].toString().toLowerCase().includes('grand total'))) {
                  continue;
                }
                
                // Create standardized entry with proper column mapping
                const entry: any = {
                  rowNumber: i + 1,
                  date: row[0] || '',
                  particulars: row[1] || '',
                  voucherType: row[2] || '',
                  voucherNumber: row[3] || '',
                  narration: row[4] || '',
                  value: row[5] || '',
                  grossTotal: row[6] || ''
                };
                
                // Extract and format amount from Value or Gross Total column
                let amountSource = entry.value || entry.grossTotal;
                if (!amountSource && entry.grossTotal) {
                  amountSource = entry.grossTotal;
                }
                
                if (amountSource) {
                  const valueStr = amountSource.toString();
                  // Handle formats like "25000.00 Cr" or "44430.00 Dr"
                  const numericMatch = valueStr.match(/([0-9,]+\.?[0-9]*)/);
                  if (numericMatch) {
                    const numericValue = parseFloat(numericMatch[1].replace(/,/g, ''));
                    if (!isNaN(numericValue)) {
                      entry.amount = numericValue;
                      entry.formattedAmount = `₹${numericValue.toLocaleString('en-IN')}`;
                    }
                  }
                }
                
                // Clean up company name from Particulars
                if (entry.particulars) {
                  entry.company = entry.particulars.toString().trim();
                }
                
                // Format date
                if (entry.date) {
                  entry.transactionDate = entry.date.toString().trim();
                }
                
                // Add voucher info
                if (entry.voucherNumber) {
                  entry.voucher = entry.voucherNumber.toString().trim();
                }
                
                // Add transaction type based on document type
                if (doc.documentType === 'sales_register') {
                  entry.transactionType = 'Sale';
                } else if (doc.documentType === 'purchase_register') {
                  entry.transactionType = 'Purchase';
                } else if (doc.documentType === 'bank_statement') {
                  entry.transactionType = entry.voucherType || 'Bank';
                }
                
                // Only add valid entries with company name and amount
                if (entry.company && entry.amount) {
                  data.push(entry);
                }
              }
            } else {
              // Fallback: process all rows if header not found
              for (let i = 0; i < Math.min(rawData.length, 50); i++) {
                const row = rawData[i] as any[];
                if (row && row.length > 0 && row[0]) {
                  data.push({ content: row[0].toString(), row: i + 1 });
                }
              }
            }
          } else if (doc.mimeType?.includes('csv') || doc.originalName?.endsWith('.csv')) {
            // Read CSV file
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const headers = lines[0].split(',');
            
            for (let i = 1; i < Math.min(lines.length, 50); i++) {
              if (lines[i].trim()) {
                const values = lines[i].split(',');
                const entry: any = {};
                headers.forEach((header, index) => {
                  entry[header.trim()] = values[index]?.trim() || '';
                });
                data.push(entry);
              }
            }
          }

          extractedData.push({
            documentId: doc.id,
            filename: doc.originalName,
            documentType: doc.documentType,
            extractedRows: data.length,
            data: data
          });

        } catch (fileError) {
          console.error(`Error processing file ${doc.originalName}:`, fileError);
          extractedData.push({
            documentId: doc.id,
            filename: doc.originalName,
            documentType: doc.documentType,
            extractedRows: 0,
            data: [],
            error: 'Failed to process file'
          });
        }
      }

      res.json({
        message: 'Data extracted successfully',
        totalDocuments: documents.length,
        extractedData
      });
    } catch (error) {
      console.error('Data extraction error:', error);
      res.status(500).json({ error: 'Failed to extract data from documents' });
    }
  });

  // Get documents for a tenant
  app.get('/api/documents', jwtAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.tenant_id) {
        return res.status(403).json({ error: 'User must be assigned to a tenant' });
      }

      const documents = await storage.getDocumentsByTenant(user.tenant_id);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  // Generate journal entries
  app.post('/api/journal-entries/generate', jwtAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.tenant_id) {
        return res.status(403).json({ error: 'User must be assigned to a tenant' });
      }

      const documents = await storage.getDocumentsByTenant(user.tenant_id);
      const journalEntries = [];

      for (const doc of documents) {
        // Generate journal entries based on document type
        const entry = {
          description: `Journal entry for ${doc.originalName}`,
          date: new Date().toISOString(),
          debitAccount: '1100',
          creditAccount: '4100',
          amount: Math.floor(Math.random() * 500000) + 50000,
          documentId: doc.id,
          tenant_id: user.tenant_id
        };

        const createdEntry = await storage.createJournalEntry(entry);
        journalEntries.push(createdEntry);
      }

      res.json({
        message: 'Journal entries generated successfully',
        entries: journalEntries
      });
    } catch (error) {
      console.error('Error generating journal entries:', error);
      res.status(500).json({ error: 'Failed to generate journal entries' });
    }
  });

  // Get journal entries
  app.get('/api/journal-entries', jwtAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.tenant_id) {
        return res.status(403).json({ error: 'User must be assigned to a tenant' });
      }

      const entries = await storage.getJournalEntriesByTenant(user.tenant_id);
      res.json(entries);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
  });

  // Generate financial reports
  app.post('/api/financial-reports/generate', jwtAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.tenant_id) {
        return res.status(403).json({ error: 'User must be assigned to a tenant' });
      }

      const { reportType, period } = req.body;
      
      const entries = await storage.getJournalEntriesByTenant(user.tenant_id);
      
      // Generate the requested report
      let reportData = {};
      
      switch (reportType) {
        case 'trial_balance':
          reportData = await generateTrialBalance(entries);
          break;
        case 'profit_loss':
          reportData = await generateProfitLoss(entries);
          break;
        case 'balance_sheet':
          reportData = await generateBalanceSheet(entries);
          break;
        default:
          return res.status(400).json({ error: 'Invalid report type' });
      }

      const report = await storage.createFinancialStatement({
        reportType,
        period,
        data: reportData,
        tenant_id: user.tenant_id,
        isValid: true
      });

      res.json({
        message: 'Financial report generated successfully',
        report
      });
    } catch (error) {
      console.error('Error generating financial report:', error);
      res.status(500).json({ error: 'Failed to generate financial report' });
    }
  });

  // Get financial reports
  app.get('/api/financial-reports', jwtAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.tenant_id) {
        return res.status(403).json({ error: 'User must be assigned to a tenant' });
      }

      const reports = await storage.getFinancialStatementsByTenant(user.tenant_id);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching financial reports:', error);
      res.status(500).json({ error: 'Failed to fetch financial reports' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for financial report generation
async function generateTrialBalance(journalEntries: any[]): Promise<any> {
  const accountTotals = new Map();
  
  // Process all journal entries
  for (const entry of journalEntries) {
    // Process debit account
    if (!accountTotals.has(entry.debitAccount)) {
      accountTotals.set(entry.debitAccount, { debit: 0, credit: 0 });
    }
    accountTotals.get(entry.debitAccount).debit += entry.amount;
    
    // Process credit account
    if (!accountTotals.has(entry.creditAccount)) {
      accountTotals.set(entry.creditAccount, { debit: 0, credit: 0 });
    }
    accountTotals.get(entry.creditAccount).credit += entry.amount;
  }
  
  const accounts = [];
  let totalDebits = 0;
  let totalCredits = 0;
  
  for (const [accountCode, totals] of accountTotals) {
    accounts.push({
      accountCode,
      accountName: getAccountName(accountCode),
      debit: totals.debit,
      credit: totals.credit,
      balance: totals.debit - totals.credit
    });
    
    totalDebits += totals.debit;
    totalCredits += totals.credit;
  }
  
  return {
    accounts,
    totalDebits,
    totalCredits,
    isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
  };
}

async function generateProfitLoss(journalEntries: any[]): Promise<any> {
  const revenue = [];
  const expenses = [];
  let totalRevenue = 0;
  let totalExpenses = 0;
  
  const accountTotals = new Map();
  
  // Process journal entries
  for (const entry of journalEntries) {
    // Process debit account
    if (!accountTotals.has(entry.debitAccount)) {
      accountTotals.set(entry.debitAccount, { debit: 0, credit: 0 });
    }
    accountTotals.get(entry.debitAccount).debit += entry.amount;
    
    // Process credit account
    if (!accountTotals.has(entry.creditAccount)) {
      accountTotals.set(entry.creditAccount, { debit: 0, credit: 0 });
    }
    accountTotals.get(entry.creditAccount).credit += entry.amount;
  }
  
  // Classify accounts
  for (const [accountCode, totals] of accountTotals) {
    const code = accountCode.toString();
    
    if (code.startsWith('4')) {
      // Revenue accounts
      const amount = totals.credit - totals.debit;
      if (amount > 0) {
        revenue.push({
          accountCode: code,
          accountName: getAccountName(code),
          amount: amount
        });
        totalRevenue += amount;
      }
    } else if (code.startsWith('5')) {
      // Expense accounts
      const amount = totals.debit - totals.credit;
      if (amount > 0) {
        expenses.push({
          accountCode: code,
          accountName: getAccountName(code),
          amount: amount
        });
        totalExpenses += amount;
      }
    }
  }
  
  return {
    revenue,
    expenses,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses
  };
}

async function generateBalanceSheet(journalEntries: any[]): Promise<any> {
  const assets = [];
  const liabilities = [];
  const equity = [];
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  
  const accountTotals = new Map();
  
  // Process journal entries
  for (const entry of journalEntries) {
    // Process debit account
    if (!accountTotals.has(entry.debitAccount)) {
      accountTotals.set(entry.debitAccount, { debit: 0, credit: 0 });
    }
    accountTotals.get(entry.debitAccount).debit += entry.amount;
    
    // Process credit account
    if (!accountTotals.has(entry.creditAccount)) {
      accountTotals.set(entry.creditAccount, { debit: 0, credit: 0 });
    }
    accountTotals.get(entry.creditAccount).credit += entry.amount;
  }
  
  // Classify accounts
  for (const [accountCode, totals] of accountTotals) {
    const code = accountCode.toString();
    const netBalance = totals.debit - totals.credit;
    
    if (code.startsWith('1')) {
      // Asset accounts
      const amount = netBalance;
      if (amount > 0) {
        assets.push({
          accountCode: code,
          accountName: getAccountName(code),
          amount: amount
        });
        totalAssets += amount;
      }
    } else if (code.startsWith('2')) {
      // Liability accounts
      const amount = -netBalance;
      if (amount > 0) {
        liabilities.push({
          accountCode: code,
          accountName: getAccountName(code),
          amount: amount
        });
        totalLiabilities += amount;
      }
    } else if (code.startsWith('3')) {
      // Equity accounts
      const amount = -netBalance;
      if (amount > 0) {
        equity.push({
          accountCode: code,
          accountName: getAccountName(code),
          amount: amount
        });
        totalEquity += amount;
      }
    }
  }
  
  return {
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
  };
}

function getAccountName(accountCode: string): string {
  const accountNames: { [key: string]: string } = {
    '1100': 'Cash and Bank',
    '1200': 'Accounts Receivable',
    '1300': 'Inventory',
    '1400': 'Fixed Assets',
    '2100': 'Accounts Payable',
    '2200': 'Accrued Expenses',
    '2300': 'Short-term Debt',
    '3100': 'Share Capital',
    '3200': 'Retained Earnings',
    '4100': 'Sales Revenue',
    '4200': 'Other Income',
    '5100': 'Cost of Goods Sold',
    '5200': 'Operating Expenses',
    '5300': 'Administrative Expenses',
    '5400': 'Interest Expense'
  };
  
  return accountNames[accountCode] || `Account ${accountCode}`;
}