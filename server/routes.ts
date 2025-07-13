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
      console.log('Upload request received', {
        hasFile: !!req.file,
        body: req.body,
        files: req.files,
        contentType: req.headers['content-type']
      });
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const file = req.file;
      const fileName = `${nanoid()}_${file.originalname}`;

      console.log('Processing file:', {
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        userId
      });

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

  // Static file serving for uploads
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
