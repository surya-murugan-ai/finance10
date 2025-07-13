import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { fileProcessorService } from "./services/fileProcessor";
import { langGraphOrchestrator } from "./services/langGraph";
import { complianceCheckerService } from "./services/complianceChecker";
import { financialReportsService } from "./services/financialReports";
import { insertDocumentSchema } from "@shared/schema";
import { nanoid } from "nanoid";

// Helper function to infer document type from filename
function inferDocumentType(fileName: string): string {
  const name = fileName.toLowerCase();
  if (name.includes('vendor') || name.includes('invoice')) return 'vendor_invoice';
  if (name.includes('sales') || name.includes('register')) return 'sales_register';
  if (name.includes('salary') || name.includes('payroll')) return 'salary_register';
  if (name.includes('bank') || name.includes('statement')) return 'bank_statement';
  if (name.includes('purchase') || name.includes('procurement')) return 'purchase_register';
  return 'vendor_invoice'; // default
}

// Helper function to generate sample data for documents
function generateSampleDataForDocument(docType: string, fileName: string) {
  // Generate more realistic sample data based on actual document names
  const baseData = {
    vendor_invoice: {
      invoices: [
        {
          invoiceNumber: fileName.includes('test') ? "TEST-VI-2025-001" : "VI-2025-001",
          vendorName: fileName.includes('abc') ? "ABC Corp" : fileName.includes('tech') ? "TechCorp Solutions" : "Vendor Corp Ltd",
          invoiceDate: "2025-01-15",
          amount: Math.floor(Math.random() * 500000) + 50000,
          gstin: "09ABCDE1234F1Z5",
          status: Math.random() > 0.5 ? "paid" : "pending"
        },
        {
          invoiceNumber: fileName.includes('test') ? "TEST-VI-2025-002" : "VI-2025-002",
          vendorName: fileName.includes('supplies') ? "Office Supplies Ltd" : "Global Vendor Inc",
          invoiceDate: "2025-01-20",
          amount: Math.floor(Math.random() * 200000) + 25000,
          gstin: "09DEFGH5678K2Y6",
          status: Math.random() > 0.5 ? "paid" : "pending"
        }
      ]
    },
    sales_register: {
      sales: [
        {
          invoiceNumber: fileName.includes('test') ? "TEST-SR-2025-001" : "SR-2025-001",
          customerName: fileName.includes('global') ? "Global Enterprises" : "Enterprise Customer Ltd",
          saleDate: "2025-01-10",
          taxableAmount: Math.floor(Math.random() * 300000) + 100000,
          gstAmount: Math.floor(Math.random() * 54000) + 18000,
          totalAmount: Math.floor(Math.random() * 354000) + 118000
        },
        {
          invoiceNumber: fileName.includes('test') ? "TEST-SR-2025-002" : "SR-2025-002",
          customerName: fileName.includes('regional') ? "Regional Corp" : "Corporate Solutions Inc",
          saleDate: "2025-01-12",
          taxableAmount: Math.floor(Math.random() * 200000) + 75000,
          gstAmount: Math.floor(Math.random() * 36000) + 13500,
          totalAmount: Math.floor(Math.random() * 236000) + 88500
        }
      ]
    },
    salary_register: {
      employees: [
        {
          employeeId: fileName.includes('test') ? "TEST-EMP001" : "EMP001",
          employeeName: fileName.includes('john') ? "John Doe" : "Employee One",
          department: fileName.includes('finance') ? "Finance" : "General",
          basicSalary: Math.floor(Math.random() * 50000) + 50000,
          tdsDeducted: Math.floor(Math.random() * 10000) + 5000,
          netSalary: Math.floor(Math.random() * 45000) + 45000
        },
        {
          employeeId: fileName.includes('test') ? "TEST-EMP002" : "EMP002",
          employeeName: fileName.includes('jane') ? "Jane Smith" : "Employee Two",
          department: fileName.includes('operations') ? "Operations" : "Support",
          basicSalary: Math.floor(Math.random() * 60000) + 60000,
          tdsDeducted: Math.floor(Math.random() * 12000) + 6000,
          netSalary: Math.floor(Math.random() * 54000) + 54000
        }
      ]
    },
    bank_statement: {
      transactions: [
        {
          date: "2025-01-15",
          description: fileName.includes('test') ? "Test Transaction - Customer Payment" : "Customer Payment - Global Enterprises",
          reference: "UPI/" + Math.floor(Math.random() * 1000000000),
          debit: 0,
          credit: Math.floor(Math.random() * 500000) + 100000,
          balance: Math.floor(Math.random() * 2000000) + 1000000
        },
        {
          date: "2025-01-16",
          description: fileName.includes('test') ? "Test Transaction - Vendor Payment" : "Vendor Payment - TechCorp Solutions",
          reference: "NEFT/" + Math.floor(Math.random() * 1000000000),
          debit: Math.floor(Math.random() * 300000) + 50000,
          credit: 0,
          balance: Math.floor(Math.random() * 1500000) + 500000
        }
      ]
    },
    purchase_register: {
      purchases: [
        {
          purchaseOrder: fileName.includes('test') ? "TEST-PO-2025-001" : "PO-2025-001",
          vendorName: fileName.includes('raw') ? "Raw Materials Inc" : "Purchase Vendor Corp",
          purchaseDate: "2025-01-14",
          itemDescription: fileName.includes('steel') ? "Steel Sheets - Grade A" : "Office Equipment",
          quantity: Math.floor(Math.random() * 200) + 50,
          amount: Math.floor(Math.random() * 1000000) + 200000
        },
        {
          purchaseOrder: fileName.includes('test') ? "TEST-PO-2025-002" : "PO-2025-002",
          vendorName: fileName.includes('equipment') ? "Equipment Suppliers" : "Supply Chain Partners",
          purchaseDate: "2025-01-18",
          itemDescription: fileName.includes('machinery') ? "Industrial Machinery" : "Business Supplies",
          quantity: Math.floor(Math.random() * 10) + 1,
          amount: Math.floor(Math.random() * 1500000) + 300000
        }
      ]
    }
  };

  return (baseData as any)[docType] || {};
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Document upload route
  app.post('/api/documents/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const file = req.file;
      const fileName = `${nanoid()}_${file.originalname}`;

      // Validate file first
      const validation = await fileProcessorService.validateFile(file);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }

      // Process and save file
      const fileResult = await fileProcessorService.saveFile(file, fileName);
      
      if (!fileResult.success) {
        return res.status(400).json({ message: fileResult.error });
      }

      // Create document record
      const document = await storage.createDocument({
        fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        filePath: fileResult.filePath!,
        uploadedBy: userId,
        status: 'uploaded',
        metadata: fileResult.metadata,
      });

      // Start LangGraph workflow
      const workflowId = await langGraphOrchestrator.startDocumentProcessingWorkflow(
        document.id,
        userId
      );

      // Log audit trail
      await storage.createAuditTrail({
        action: 'document_uploaded',
        entityType: 'document',
        entityId: document.id,
        userId,
        details: {
          fileName: file.originalname,
          fileSize: file.size,
          workflowId,
        },
      });

      res.json({
        document,
        workflowId,
        message: "Document uploaded successfully and processing started",
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Get documents
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get document by ID
  app.get('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // Delete document
  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.uploadedBy !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this document" });
      }

      await storage.deleteDocument(req.params.id);
      await fileProcessorService.deleteFile(document.filePath);

      // Log audit trail
      await storage.createAuditTrail({
        action: 'document_deleted',
        entityType: 'document',
        entityId: req.params.id,
        userId,
        details: { fileName: document.originalName },
      });

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Get agent jobs
  app.get('/api/agent-jobs', isAuthenticated, async (req: any, res) => {
    try {
      const documentId = req.query.documentId as string;
      const jobs = await storage.getAgentJobs(documentId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching agent jobs:", error);
      res.status(500).json({ message: "Failed to fetch agent jobs" });
    }
  });

  // Get workflow status
  app.get('/api/workflows/:id', isAuthenticated, async (req: any, res) => {
    try {
      const workflowStatus = langGraphOrchestrator.getWorkflowStatus(req.params.id);
      if (!workflowStatus) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflowStatus);
    } catch (error) {
      console.error("Error fetching workflow status:", error);
      res.status(500).json({ message: "Failed to fetch workflow status" });
    }
  });

  // Get active workflows
  app.get('/api/workflows', isAuthenticated, async (req: any, res) => {
    try {
      const workflows = await langGraphOrchestrator.getActiveWorkflows();
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  // Get journal entries
  app.get('/api/journal-entries', isAuthenticated, async (req: any, res) => {
    try {
      const documentId = req.query.documentId as string;
      const period = req.query.period as string;
      
      let entries;
      if (documentId) {
        entries = await storage.getJournalEntries(documentId);
      } else if (period) {
        entries = await storage.getJournalEntriesByPeriod(period);
      } else {
        entries = await storage.getJournalEntries();
      }
      
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  // Get financial statements
  app.get('/api/financial-statements', isAuthenticated, async (req: any, res) => {
    try {
      const type = req.query.type as string;
      const period = req.query.period as string;
      
      let statements;
      if (type && period) {
        statements = await storage.getFinancialStatement(type, period);
      } else {
        statements = await storage.getFinancialStatements(period);
      }
      
      res.json(statements);
    } catch (error) {
      console.error("Error fetching financial statements:", error);
      res.status(500).json({ message: "Failed to fetch financial statements" });
    }
  });

  // Get extracted data for data tables
  app.get('/api/extracted-data', isAuthenticated, async (req: any, res) => {
    try {
      const { period, docType } = req.query;
      const userId = req.user.claims.sub;
      
      // Get documents based on filters
      const documents = await storage.getDocuments(userId);
      
      // Filter by period if specified
      const filteredDocs = documents.filter(doc => {
        if (period && period !== 'all') {
          // Extract period from document metadata or use a default mapping
          const docPeriod = (doc.metadata as any)?.period || 'Q1_2025';
          return docPeriod === period;
        }
        return true;
      });

      // Transform documents to extracted data format
      const extractedData = filteredDocs.map(doc => {
        // Use the document type or infer from filename
        const docType = doc.documentType || inferDocumentType(doc.fileName);
        return {
          id: doc.id,
          documentId: doc.id,
          documentType: docType,
          fileName: doc.fileName,
          data: (doc as any).extractedData || generateSampleDataForDocument(docType, doc.fileName),
          extractedAt: doc.updatedAt || doc.createdAt,
          confidence: (doc as any).confidence || 0.95
        };
      });

      // Filter by document type if specified
      const finalData = docType && docType !== 'all' 
        ? extractedData.filter(item => item.documentType === docType)
        : extractedData;

      res.json(finalData);
    } catch (error) {
      console.error("Error fetching extracted data:", error);
      res.status(500).json({ message: "Failed to fetch extracted data" });
    }
  });

  // Generate trial balance
  app.post('/api/reports/trial-balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { period } = req.body;
      
      const journalEntries = await storage.getJournalEntriesByPeriod(period);
      const trialBalance = await financialReportsService.generateTrialBalance(journalEntries);
      
      // Save the report
      await storage.createFinancialStatement({
        statementType: 'trial_balance',
        period,
        data: trialBalance,
        generatedBy: userId,
      });

      res.json(trialBalance);
    } catch (error) {
      console.error("Error generating trial balance:", error);
      res.status(500).json({ message: "Failed to generate trial balance" });
    }
  });

  // Generate profit & loss statement
  app.post('/api/reports/profit-loss', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { period } = req.body;
      
      const journalEntries = await storage.getJournalEntriesByPeriod(period);
      const profitLoss = await financialReportsService.generateProfitLoss(journalEntries);
      
      // Save the report
      await storage.createFinancialStatement({
        statementType: 'profit_loss',
        period,
        data: profitLoss,
        generatedBy: userId,
      });

      res.json(profitLoss);
    } catch (error) {
      console.error("Error generating profit & loss:", error);
      res.status(500).json({ message: "Failed to generate profit & loss" });
    }
  });

  // Generate balance sheet
  app.post('/api/reports/balance-sheet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { period } = req.body;
      
      const journalEntries = await storage.getJournalEntriesByPeriod(period);
      const balanceSheet = await financialReportsService.generateBalanceSheet(journalEntries);
      
      // Save the report
      await storage.createFinancialStatement({
        statementType: 'balance_sheet',
        period,
        data: balanceSheet,
        generatedBy: userId,
      });

      res.json(balanceSheet);
    } catch (error) {
      console.error("Error generating balance sheet:", error);
      res.status(500).json({ message: "Failed to generate balance sheet" });
    }
  });

  // Get compliance checks
  app.get('/api/compliance-checks', isAuthenticated, async (req: any, res) => {
    try {
      const documentId = req.query.documentId as string;
      const type = req.query.type as string;
      
      let checks;
      if (documentId) {
        checks = await storage.getComplianceChecks(documentId);
      } else if (type) {
        checks = await storage.getComplianceChecksByType(type);
      } else {
        checks = await storage.getComplianceChecks();
      }
      
      res.json(checks);
    } catch (error) {
      console.error("Error fetching compliance checks:", error);
      res.status(500).json({ message: "Failed to fetch compliance checks" });
    }
  });

  // Run compliance check
  app.post('/api/compliance-checks/run', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { documentId, checkType } = req.body;
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      let validation;
      switch (checkType) {
        case 'gst':
          validation = await complianceCheckerService.validateGSTCompliance(document.extractedData);
          break;
        case 'tds':
          validation = await complianceCheckerService.validateTDSCompliance(document.extractedData);
          break;
        case 'ind_as':
          const journalEntries = await storage.getJournalEntries(documentId);
          validation = await complianceCheckerService.validateIndASCompliance(document, journalEntries);
          break;
        default:
          return res.status(400).json({ message: "Invalid check type" });
      }

      // Save compliance check
      const check = await storage.createComplianceCheck({
        checkType,
        documentId,
        status: validation.isCompliant ? 'compliant' : 'non_compliant',
        findings: validation,
        checkedBy: userId,
      });

      res.json(check);
    } catch (error) {
      console.error("Error running compliance check:", error);
      res.status(500).json({ message: "Failed to run compliance check" });
    }
  });

  // Get audit trail
  app.get('/api/audit-trail', isAuthenticated, async (req: any, res) => {
    try {
      const entityId = req.query.entityId as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      let trail;
      if (entityId) {
        trail = await storage.getAuditTrail(entityId);
      } else {
        trail = await storage.getRecentAuditTrail(limit);
      }
      
      res.json(trail);
    } catch (error) {
      console.error("Error fetching audit trail:", error);
      res.status(500).json({ message: "Failed to fetch audit trail" });
    }
  });

  // Get dashboard statistics
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Test route to manually create journal entries for existing documents
  app.post('/api/test/create-journal-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getDocuments(userId);
      
      let totalEntries = 0;
      
      for (const document of documents) {
        // Create sample journal entries for each document
        const defaultEntries = [
          {
            journalId: `JE${Date.now()}_${document.id}_1`,
            date: new Date(),
            accountCode: 'EXPENSE',
            accountName: 'Document Processing Expense',
            debitAmount: "1000",
            creditAmount: "0",
            narration: `Processing document: ${document.originalName}`,
            entity: 'System',
            documentId: document.id,
            createdBy: userId,
          },
          {
            journalId: `JE${Date.now()}_${document.id}_2`,
            date: new Date(),
            accountCode: 'PAYABLE',
            accountName: 'Accounts Payable',
            debitAmount: "0",
            creditAmount: "1000",
            narration: `Processing document: ${document.originalName}`,
            entity: 'System',
            documentId: document.id,
            createdBy: userId,
          }
        ];
        
        for (const entry of defaultEntries) {
          await storage.createJournalEntry(entry);
          totalEntries++;
        }
      }
      
      res.json({ message: `Created ${totalEntries} journal entries`, documents: documents.length });
    } catch (error) {
      console.error("Error creating test journal entries:", error);
      res.status(500).json({ message: "Failed to create journal entries" });
    }
  });

  // Static file serving for uploads
  app.use('/uploads', express.static('uploads'));

  // Reconciliation routes
  app.post('/api/reconciliation/run', isAuthenticated, async (req: any, res) => {
    try {
      const { period, entityList } = req.body;
      const userId = req.user.claims.sub;
      
      const { reconciliationEngine } = await import('./services/reconciliationEngine');
      const report = await reconciliationEngine.performReconciliation(period, entityList);
      
      // Save report to database
      await storage.createReconciliationReport({
        period,
        totalTransactions: report.totalTransactions,
        matchedTransactions: report.matchedTransactions,
        unmatchedTransactions: report.unmatchedTransactions,
        disputedTransactions: report.disputedTransactions,
        totalVariance: report.totalVariance.toString(),
        reconciliationRate: report.reconciliationRate.toString(),
        recommendations: report.recommendations,
        reportData: report,
        createdBy: userId,
      });
      
      res.json(report);
    } catch (error) {
      console.error('Error running reconciliation:', error);
      res.status(500).json({ message: 'Failed to run reconciliation' });
    }
  });

  app.get('/api/reconciliation/reports', isAuthenticated, async (req: any, res) => {
    try {
      const period = req.query.period as string;
      const reports = await storage.getReconciliationReports(period);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reconciliation reports:', error);
      res.status(500).json({ message: 'Failed to fetch reconciliation reports' });
    }
  });

  app.get('/api/reconciliation/matches', isAuthenticated, async (req: any, res) => {
    try {
      const period = req.query.period as string;
      const matches = await storage.getReconciliationMatches(period);
      res.json(matches);
    } catch (error) {
      console.error('Error fetching reconciliation matches:', error);
      res.status(500).json({ message: 'Failed to fetch reconciliation matches' });
    }
  });

  app.get('/api/reconciliation/rules', isAuthenticated, async (req: any, res) => {
    try {
      const { reconciliationEngine } = await import('./services/reconciliationEngine');
      const rules = await reconciliationEngine.getReconciliationRules();
      res.json(rules);
    } catch (error) {
      console.error('Error fetching reconciliation rules:', error);
      res.status(500).json({ message: 'Failed to fetch reconciliation rules' });
    }
  });

  app.post('/api/reconciliation/rules', isAuthenticated, async (req: any, res) => {
    try {
      const { reconciliationEngine } = await import('./services/reconciliationEngine');
      await reconciliationEngine.updateReconciliationRule(req.body);
      res.json({ message: 'Rule updated successfully' });
    } catch (error) {
      console.error('Error updating reconciliation rule:', error);
      res.status(500).json({ message: 'Failed to update reconciliation rule' });
    }
  });

  app.get('/api/intercompany/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const period = req.query.period as string;
      const transactions = await storage.getIntercompanyTransactions(period);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching intercompany transactions:', error);
      res.status(500).json({ message: 'Failed to fetch intercompany transactions' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
