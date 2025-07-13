import {
  users,
  documents,
  agentJobs,
  journalEntries,
  financialStatements,
  complianceChecks,
  auditTrail,
  reconciliationReports,
  reconciliationMatches,
  intercompanyTransactions,
  dataSources,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type AgentJob,
  type InsertAgentJob,
  type JournalEntry,
  type InsertJournalEntry,
  type FinancialStatement,
  type InsertFinancialStatement,
  type ComplianceCheck,
  type InsertComplianceCheck,
  type AuditTrail,
  type InsertAuditTrail,
  type ReconciliationReport,
  type InsertReconciliationReport,
  type ReconciliationMatch,
  type InsertReconciliationMatch,
  type IntercompanyTransaction,
  type InsertIntercompanyTransaction,
  type DataSource,
  type InsertDataSource,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocuments(userId: string): Promise<Document[]>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;

  // Agent job operations
  createAgentJob(job: InsertAgentJob): Promise<AgentJob>;
  getAgentJob(id: string): Promise<AgentJob | undefined>;
  getAgentJobs(documentId?: string): Promise<AgentJob[]>;
  updateAgentJob(id: string, updates: Partial<AgentJob>): Promise<AgentJob>;

  // Journal entry operations
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntries(documentId?: string): Promise<JournalEntry[]>;
  getJournalEntriesByPeriod(period: string): Promise<JournalEntry[]>;
  deleteJournalEntry(id: string): Promise<void>;

  // Financial statement operations
  createFinancialStatement(statement: InsertFinancialStatement): Promise<FinancialStatement>;
  getFinancialStatement(type: string, period: string): Promise<FinancialStatement | undefined>;
  getFinancialStatements(period?: string): Promise<FinancialStatement[]>;
  deleteFinancialStatement(id: string): Promise<void>;

  // Compliance check operations
  createComplianceCheck(check: InsertComplianceCheck): Promise<ComplianceCheck>;
  getComplianceChecks(documentId?: string): Promise<ComplianceCheck[]>;
  getComplianceChecksByType(type: string): Promise<ComplianceCheck[]>;

  // Audit trail operations
  createAuditTrail(trail: InsertAuditTrail): Promise<AuditTrail>;
  getAuditTrail(entityId?: string): Promise<AuditTrail[]>;
  getRecentAuditTrail(limit?: number): Promise<AuditTrail[]>;

  // Dashboard statistics
  getDashboardStats(userId: string): Promise<{
    documentsProcessed: number;
    activeAgents: number;
    validationErrors: number;
    complianceScore: number;
  }>;

  // Reconciliation operations
  createReconciliationReport(report: InsertReconciliationReport): Promise<ReconciliationReport>;
  getReconciliationReports(period?: string): Promise<ReconciliationReport[]>;
  getReconciliationMatches(period?: string): Promise<ReconciliationMatch[]>;
  createReconciliationMatch(match: InsertReconciliationMatch): Promise<ReconciliationMatch>;
  getIntercompanyTransactions(period?: string): Promise<IntercompanyTransaction[]>;
  createIntercompanyTransaction(transaction: InsertIntercompanyTransaction): Promise<IntercompanyTransaction>;

  // Settings operations
  getSettings(userId: string): Promise<any>;
  createSettings(settings: any): Promise<any>;
  updateSettings(id: string, settings: any): Promise<any>;
  testConnection(): Promise<boolean>;

  // Data source operations
  createDataSource(dataSource: InsertDataSource): Promise<DataSource>;
  getDataSource(id: string): Promise<DataSource | undefined>;
  getDataSources(userId: string): Promise<DataSource[]>;
  updateDataSource(id: string, updates: Partial<DataSource>): Promise<DataSource>;
  deleteDataSource(id: string): Promise<void>;
  testDataSourceConnection(id: string): Promise<{ success: boolean; error?: string }>;
  getDataSourceTypes(): Promise<Array<{ value: string; name: string; description: string }>>;
  getDatabaseTypes(): Promise<Array<{ value: string; name: string; default_port: number }>>;

  // Company profile operations
  createCompanyProfile(profile: any): Promise<any>;
  getCompanyProfile(userId: string): Promise<any>;
  updateCompanyProfile(userId: string, profile: any): Promise<any>;

  // User flow tracking
  createUserFlowEntry(entry: any): Promise<any>;
  getUserFlowEntries(userId: string): Promise<any[]>;

  // Close calendar operations
  getCloseCalendar(userId: string): Promise<any>;
  updateCloseCalendar(userId: string, calendar: any): Promise<any>;

  // User roles operations
  getUserRoles(userId: string): Promise<any[]>;
  createUserRole(role: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [doc] = await db.insert(documents).values(document).returning();
    return doc;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocuments(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.uploadedBy, userId))
      .orderBy(desc(documents.createdAt));
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Agent job operations
  async createAgentJob(job: InsertAgentJob): Promise<AgentJob> {
    const [agentJob] = await db.insert(agentJobs).values(job).returning();
    return agentJob;
  }

  async getAgentJob(id: string): Promise<AgentJob | undefined> {
    const [job] = await db.select().from(agentJobs).where(eq(agentJobs.id, id));
    return job;
  }

  async getAgentJobs(documentId?: string): Promise<AgentJob[]> {
    if (documentId) {
      return await db
        .select()
        .from(agentJobs)
        .where(eq(agentJobs.documentId, documentId))
        .orderBy(desc(agentJobs.createdAt));
    }
    return await db
      .select()
      .from(agentJobs)
      .orderBy(desc(agentJobs.createdAt));
  }

  async updateAgentJob(id: string, updates: Partial<AgentJob>): Promise<AgentJob> {
    const [job] = await db
      .update(agentJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agentJobs.id, id))
      .returning();
    return job;
  }

  // Journal entry operations
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [journalEntry] = await db.insert(journalEntries).values(entry).returning();
    return journalEntry;
  }

  async getJournalEntries(documentId?: string): Promise<JournalEntry[]> {
    if (documentId) {
      return await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.documentId, documentId))
        .orderBy(desc(journalEntries.date));
    }
    return await db
      .select()
      .from(journalEntries)
      .orderBy(desc(journalEntries.date));
  }

  async getJournalEntriesByPeriod(period: string): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(sql`DATE_PART('year', ${journalEntries.date}) = ${period.split('_')[1]}`)
      .orderBy(desc(journalEntries.date));
  }

  async deleteJournalEntry(id: string): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  // Financial statement operations
  async createFinancialStatement(statement: InsertFinancialStatement): Promise<FinancialStatement> {
    const [financialStatement] = await db.insert(financialStatements).values(statement).returning();
    return financialStatement;
  }

  async getFinancialStatement(type: string, period: string): Promise<FinancialStatement | undefined> {
    const [statement] = await db
      .select()
      .from(financialStatements)
      .where(and(
        eq(financialStatements.statementType, type),
        eq(financialStatements.period, period)
      ));
    return statement;
  }

  async getFinancialStatements(period?: string): Promise<FinancialStatement[]> {
    if (period) {
      return await db
        .select()
        .from(financialStatements)
        .where(eq(financialStatements.period, period))
        .orderBy(desc(financialStatements.generatedAt));
    }
    return await db
      .select()
      .from(financialStatements)
      .orderBy(desc(financialStatements.generatedAt));
  }

  async deleteFinancialStatement(id: string): Promise<void> {
    await db.delete(financialStatements).where(eq(financialStatements.id, id));
  }

  // Compliance check operations
  async createComplianceCheck(check: InsertComplianceCheck): Promise<ComplianceCheck> {
    const [complianceCheck] = await db.insert(complianceChecks).values(check).returning();
    return complianceCheck;
  }

  async getComplianceChecks(documentId?: string): Promise<ComplianceCheck[]> {
    if (documentId) {
      return await db
        .select()
        .from(complianceChecks)
        .where(eq(complianceChecks.documentId, documentId))
        .orderBy(desc(complianceChecks.checkedAt));
    }
    return await db
      .select()
      .from(complianceChecks)
      .orderBy(desc(complianceChecks.checkedAt));
  }

  async getComplianceChecksByType(type: string): Promise<ComplianceCheck[]> {
    return await db
      .select()
      .from(complianceChecks)
      .where(eq(complianceChecks.checkType, type))
      .orderBy(desc(complianceChecks.checkedAt));
  }

  // Audit trail operations
  async createAuditTrail(trail: InsertAuditTrail): Promise<AuditTrail> {
    const [auditTrailEntry] = await db.insert(auditTrail).values(trail).returning();
    return auditTrailEntry;
  }

  async getAuditTrail(entityId?: string): Promise<AuditTrail[]> {
    if (entityId) {
      return await db
        .select()
        .from(auditTrail)
        .where(eq(auditTrail.entityId, entityId))
        .orderBy(desc(auditTrail.timestamp));
    }
    return await db
      .select()
      .from(auditTrail)
      .orderBy(desc(auditTrail.timestamp));
  }

  async getRecentAuditTrail(limit: number = 10): Promise<AuditTrail[]> {
    return await db
      .select()
      .from(auditTrail)
      .orderBy(desc(auditTrail.timestamp))
      .limit(limit);
  }

  // Dashboard statistics
  async getDashboardStats(userId: string): Promise<{
    documentsProcessed: number;
    activeAgents: number;
    validationErrors: number;
    complianceScore: number;
  }> {
    const [docCount] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.uploadedBy, userId));

    const [activeAgentCount] = await db
      .select({ count: count() })
      .from(agentJobs)
      .where(eq(agentJobs.status, "running"));

    const [validationErrorCount] = await db
      .select({ count: count() })
      .from(documents)
      .where(and(
        eq(documents.uploadedBy, userId),
        eq(documents.status, "failed")
      ));

    const [complianceStats] = await db
      .select({ 
        total: count(),
        compliant: count(sql`CASE WHEN ${complianceChecks.status} = 'compliant' THEN 1 END`)
      })
      .from(complianceChecks);

    const complianceScore = complianceStats.total > 0 
      ? Math.round((complianceStats.compliant / complianceStats.total) * 100)
      : 100;

    return {
      documentsProcessed: docCount.count,
      activeAgents: activeAgentCount.count,
      validationErrors: validationErrorCount.count,
      complianceScore,
    };
  }

  // Reconciliation operations
  async createReconciliationReport(report: InsertReconciliationReport): Promise<ReconciliationReport> {
    const [newReport] = await db.insert(reconciliationReports).values(report).returning();
    return newReport;
  }

  async getReconciliationReports(period?: string): Promise<ReconciliationReport[]> {
    if (period) {
      return await db.select().from(reconciliationReports).where(eq(reconciliationReports.period, period));
    }
    return await db.select().from(reconciliationReports).orderBy(desc(reconciliationReports.createdAt));
  }

  async getReconciliationMatches(period?: string): Promise<ReconciliationMatch[]> {
    if (period) {
      return await db.select().from(reconciliationMatches).where(eq(reconciliationMatches.period, period));
    }
    return await db.select().from(reconciliationMatches).orderBy(desc(reconciliationMatches.createdAt));
  }

  async createReconciliationMatch(match: InsertReconciliationMatch): Promise<ReconciliationMatch> {
    const [newMatch] = await db.insert(reconciliationMatches).values(match).returning();
    return newMatch;
  }

  async getIntercompanyTransactions(period?: string): Promise<IntercompanyTransaction[]> {
    if (period) {
      // Extract year from period (e.g., "Q1_2025" -> "2025")
      const year = period.split('_')[1];
      return await db.select().from(intercompanyTransactions)
        .where(sql`EXTRACT(YEAR FROM ${intercompanyTransactions.transactionDate}) = ${year}`);
    }
    return await db.select().from(intercompanyTransactions).orderBy(desc(intercompanyTransactions.createdAt));
  }

  async createIntercompanyTransaction(transaction: InsertIntercompanyTransaction): Promise<IntercompanyTransaction> {
    const [newTransaction] = await db.insert(intercompanyTransactions).values(transaction).returning();
    return newTransaction;
  }

  // Settings operations
  async getSettings(userId: string): Promise<any> {
    // For now, return null as we don't have a settings table yet
    // In a real implementation, you'd query a settings table
    return null;
  }

  async createSettings(settings: any): Promise<any> {
    // For now, just return the settings as-is
    // In a real implementation, you'd insert into a settings table
    return settings;
  }

  async updateSettings(id: string, settings: any): Promise<any> {
    // For now, just return the updated settings
    // In a real implementation, you'd update the settings table
    return settings;
  }

  async testConnection(): Promise<boolean> {
    try {
      // Simple test query to check database connectivity
      await db.select().from(users).limit(1);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Company profile operations
  async createCompanyProfile(profile: any): Promise<any> {
    const profileData = {
      id: `profile_${profile.userId}`,
      userId: profile.userId,
      data: JSON.stringify(profile),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Store company profile in audit trail for now
    await this.createAuditTrail({
      userId: profile.userId,
      action: "company_profile_created",
      entityType: "company",
      entityId: profile.userId,
      details: JSON.stringify(profile),
    });
    
    return profileData;
  }

  async getCompanyProfile(userId: string): Promise<any> {
    // Get the latest company profile from audit trail
    const auditEntries = await this.getAuditTrail(userId);
    const profileEntry = auditEntries.find(entry => entry.action === "company_profile_created");
    
    if (!profileEntry) {
      return null;
    }
    
    return JSON.parse(profileEntry.details as string);
  }

  async updateCompanyProfile(userId: string, profile: any): Promise<any> {
    await this.createAuditTrail({
      userId,
      action: "company_profile_updated",
      entityType: "company",
      entityId: userId,
      details: JSON.stringify(profile),
    });
    
    return profile;
  }

  // User flow tracking
  async createUserFlowEntry(entry: any): Promise<any> {
    const flowEntry = {
      id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: entry.userId,
      step: entry.step,
      action: entry.action,
      metadata: entry.metadata || '{}',
      timestamp: entry.timestamp || new Date(),
    };
    
    await this.createAuditTrail({
      userId: entry.userId,
      action: "user_flow_tracked",
      entityType: "flow",
      entityId: flowEntry.id,
      details: JSON.stringify(flowEntry),
    });
    
    return flowEntry;
  }

  async getUserFlowEntries(userId: string): Promise<any[]> {
    const auditEntries = await this.getAuditTrail(userId);
    return auditEntries
      .filter(entry => entry.action === "user_flow_tracked")
      .map(entry => JSON.parse(entry.details as string));
  }

  // Close calendar operations
  async getCloseCalendar(userId: string): Promise<any> {
    const auditEntries = await this.getAuditTrail(userId);
    const calendarEntry = auditEntries.find(entry => entry.action === "calendar_created" || entry.action === "calendar_updated");
    
    if (!calendarEntry) {
      return null;
    }
    
    return JSON.parse(calendarEntry.details as string);
  }

  async updateCloseCalendar(userId: string, calendar: any): Promise<any> {
    await this.createAuditTrail({
      userId,
      action: "calendar_updated",
      entityType: "calendar",
      entityId: userId,
      details: JSON.stringify(calendar),
    });
    
    return calendar;
  }

  // User roles operations
  async getUserRoles(userId: string): Promise<any[]> {
    const auditEntries = await this.getAuditTrail(userId);
    return auditEntries
      .filter(entry => entry.action === "user_role_created")
      .map(entry => JSON.parse(entry.details as string));
  }

  async createUserRole(role: any): Promise<any> {
    const roleData = {
      id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: role.userId,
      ...role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await this.createAuditTrail({
      userId: role.userId,
      action: "user_role_created",
      entityType: "role",
      entityId: roleData.id,
      details: JSON.stringify(roleData),
    });
    
    return roleData;
  }

  // Data source operations
  async createDataSource(dataSource: InsertDataSource): Promise<DataSource> {
    const [newDataSource] = await db.insert(dataSources).values(dataSource).returning();
    return newDataSource;
  }

  async getDataSource(id: string): Promise<DataSource | undefined> {
    const [dataSource] = await db.select().from(dataSources).where(eq(dataSources.id, id));
    return dataSource;
  }

  async getDataSources(userId: string): Promise<DataSource[]> {
    return await db.select().from(dataSources)
      .where(eq(dataSources.userId, userId))
      .orderBy(desc(dataSources.createdAt));
  }

  async updateDataSource(id: string, updates: Partial<DataSource>): Promise<DataSource> {
    const [dataSource] = await db
      .update(dataSources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dataSources.id, id))
      .returning();
    return dataSource;
  }

  async deleteDataSource(id: string): Promise<void> {
    await db.delete(dataSources).where(eq(dataSources.id, id));
  }

  async testDataSourceConnection(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const dataSource = await this.getDataSource(id);
      if (!dataSource) {
        return { success: false, error: "Data source not found" };
      }

      // Update last tested timestamp
      await this.updateDataSource(id, {
        lastTested: new Date(),
        status: 'testing' as any
      });

      // Mock connection test based on data source type
      let testResult = { success: true };

      switch (dataSource.type) {
        case 'database':
          // In real implementation, would test actual database connection
          testResult = { success: true };
          break;
        case 'api':
          // In real implementation, would test API endpoint
          testResult = { success: true };
          break;
        case 'file_system':
          // In real implementation, would test file system access
          testResult = { success: true };
          break;
        default:
          testResult = { success: true };
      }

      // Update status based on test result
      await this.updateDataSource(id, {
        status: testResult.success ? 'connected' : 'error',
        errorMessage: testResult.success ? null : 'Connection failed'
      });

      return testResult;
    } catch (error) {
      await this.updateDataSource(id, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getDataSourceTypes(): Promise<Array<{ value: string; name: string; description: string }>> {
    return [
      { value: 'database', name: 'Database', description: 'Connect to SQL/NoSQL databases' },
      { value: 'api', name: 'REST API', description: 'Connect to REST API endpoints' },
      { value: 'file_system', name: 'File System', description: 'Access local or network file systems' },
      { value: 'ftp', name: 'FTP/SFTP', description: 'File transfer protocol connections' },
      { value: 'cloud_storage', name: 'Cloud Storage', description: 'AWS S3, Google Cloud, Azure Blob' },
      { value: 'erp_system', name: 'ERP System', description: 'SAP, Oracle, Tally integrations' },
      { value: 'banking_api', name: 'Banking API', description: 'Bank account and transaction data' },
      { value: 'gst_portal', name: 'GST Portal', description: 'Indian GST filing system' },
      { value: 'mca_portal', name: 'MCA Portal', description: 'Ministry of Corporate Affairs' },
      { value: 'sftp', name: 'SFTP', description: 'Secure file transfer protocol' },
      { value: 'webhook', name: 'Webhook', description: 'Receive data via HTTP webhooks' }
    ];
  }

  async getDatabaseTypes(): Promise<Array<{ value: string; name: string; default_port: number }>> {
    return [
      { value: 'postgresql', name: 'PostgreSQL', default_port: 5432 },
      { value: 'mysql', name: 'MySQL', default_port: 3306 },
      { value: 'sqlite', name: 'SQLite', default_port: 0 },
      { value: 'oracle', name: 'Oracle Database', default_port: 1521 },
      { value: 'sqlserver', name: 'SQL Server', default_port: 1433 },
      { value: 'mongodb', name: 'MongoDB', default_port: 27017 }
    ];
  }
}

export const storage = new DatabaseStorage();
