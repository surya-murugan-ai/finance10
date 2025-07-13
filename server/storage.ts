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

  // Financial statement operations
  createFinancialStatement(statement: InsertFinancialStatement): Promise<FinancialStatement>;
  getFinancialStatement(type: string, period: string): Promise<FinancialStatement | undefined>;
  getFinancialStatements(period?: string): Promise<FinancialStatement[]>;

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
}

export const storage = new DatabaseStorage();
