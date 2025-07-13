import { storage } from '../storage';
import { anthropicService } from './anthropic';
import { fileProcessorService } from './fileProcessor';
import { complianceCheckerService } from './complianceChecker';
import { financialReportsService } from './financialReports';
import type { Document, AgentJob } from '@shared/schema';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused';

export interface LangGraphNode {
  id: string;
  name: string;
  type: 'agent' | 'condition' | 'action';
  status: AgentStatus;
  input?: any;
  output?: any;
  error?: string;
  dependencies: string[];
}

export interface WorkflowState {
  documentId: string;
  currentNode: string;
  nodes: Record<string, LangGraphNode>;
  globalState: any;
  completed: boolean;
  error?: string;
}

export class LangGraphOrchestrator {
  private workflows: Map<string, WorkflowState> = new Map();

  async startDocumentProcessingWorkflow(documentId: string, userId: string): Promise<string> {
    const document = await storage.getDocument(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    const workflowId = `workflow_${documentId}_${Date.now()}`;
    
    // Define the workflow DAG
    const workflow: WorkflowState = {
      documentId,
      currentNode: 'classifier',
      completed: false,
      globalState: {
        document,
        userId,
        extractedData: null,
        journalEntries: [],
        complianceChecks: [],
      },
      nodes: {
        classifier: {
          id: 'classifier',
          name: 'ClassifierBot',
          type: 'agent',
          status: 'idle',
          dependencies: [],
        },
        extractor: {
          id: 'extractor',
          name: 'DataExtractor',
          type: 'agent',
          status: 'idle',
          dependencies: ['classifier'],
        },
        gst_validator: {
          id: 'gst_validator',
          name: 'GSTValidator',
          type: 'agent',
          status: 'idle',
          dependencies: ['extractor'],
        },
        tds_validator: {
          id: 'tds_validator',
          name: 'TDSValidator',
          type: 'agent',
          status: 'idle',
          dependencies: ['extractor'],
        },
        journal_bot: {
          id: 'journal_bot',
          name: 'JournalBot',
          type: 'agent',
          status: 'idle',
          dependencies: ['gst_validator', 'tds_validator'],
        },
        conso_ai: {
          id: 'conso_ai',
          name: 'ConsoAI',
          type: 'agent',
          status: 'idle',
          dependencies: ['journal_bot'],
        },
        audit_agent: {
          id: 'audit_agent',
          name: 'AuditAgent',
          type: 'agent',
          status: 'idle',
          dependencies: ['conso_ai'],
        },
      },
    };

    this.workflows.set(workflowId, workflow);

    // Start the workflow
    await this.executeWorkflow(workflowId);
    
    return workflowId;
  }

  async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    try {
      while (!workflow.completed) {
        const currentNode = workflow.nodes[workflow.currentNode];
        
        // Check if dependencies are completed
        const dependenciesCompleted = currentNode.dependencies.every(
          depId => workflow.nodes[depId].status === 'completed'
        );

        if (!dependenciesCompleted) {
          // Wait for dependencies
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Execute the current node
        await this.executeNode(workflowId, currentNode);

        // Find next node to execute
        const nextNode = this.findNextNode(workflow);
        if (nextNode) {
          workflow.currentNode = nextNode;
        } else {
          workflow.completed = true;
        }
      }
    } catch (error) {
      workflow.error = error.message;
      workflow.completed = true;
    }
  }

  private async executeNode(workflowId: string, node: LangGraphNode): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    // Create agent job record
    const agentJob = await storage.createAgentJob({
      jobId: `${workflowId}_${node.id}`,
      agentName: node.name,
      status: 'running',
      documentId: workflow.documentId,
      input: node.input,
    });

    // Update node status
    node.status = 'running';

    // Log audit trail
    await storage.createAuditTrail({
      action: `${node.name} started`,
      entityType: 'agent_job',
      entityId: agentJob.id,
      userId: workflow.globalState.userId,
      details: { workflowId, nodeId: node.id },
    });

    try {
      switch (node.id) {
        case 'classifier':
          await this.executeClassifierBot(workflow, node);
          break;
        case 'extractor':
          await this.executeDataExtractor(workflow, node);
          break;
        case 'gst_validator':
          await this.executeGSTValidator(workflow, node);
          break;
        case 'tds_validator':
          await this.executeTDSValidator(workflow, node);
          break;
        case 'journal_bot':
          await this.executeJournalBot(workflow, node);
          break;
        case 'conso_ai':
          await this.executeConsoAI(workflow, node);
          break;
        case 'audit_agent':
          await this.executeAuditAgent(workflow, node);
          break;
        default:
          throw new Error(`Unknown node type: ${node.id}`);
      }

      node.status = 'completed';
      await storage.updateAgentJob(agentJob.id, {
        status: 'completed',
        output: node.output,
        completedAt: new Date(),
      });

      // Log completion
      await storage.createAuditTrail({
        action: `${node.name} completed`,
        entityType: 'agent_job',
        entityId: agentJob.id,
        userId: workflow.globalState.userId,
        details: { workflowId, nodeId: node.id, output: node.output },
      });

    } catch (error) {
      node.status = 'failed';
      node.error = error.message;
      
      await storage.updateAgentJob(agentJob.id, {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      });

      // Log failure
      await storage.createAuditTrail({
        action: `${node.name} failed`,
        entityType: 'agent_job',
        entityId: agentJob.id,
        userId: workflow.globalState.userId,
        details: { workflowId, nodeId: node.id, error: error.message },
      });

      throw error;
    }
  }

  private async executeClassifierBot(workflow: WorkflowState, node: LangGraphNode): Promise<void> {
    const document = workflow.globalState.document;
    const content = await fileProcessorService.extractTextContent(document.filePath);
    
    const classification = await anthropicService.classifyDocument(
      document.originalName,
      content
    );

    // Update document with classification
    await storage.updateDocument(document.id, {
      documentType: classification.documentType as any,
      status: 'classified',
      metadata: { classification },
    });

    node.output = classification;
    workflow.globalState.classification = classification;
  }

  private async executeDataExtractor(workflow: WorkflowState, node: LangGraphNode): Promise<void> {
    const document = workflow.globalState.document;
    const classification = workflow.globalState.classification;
    
    const content = await fileProcessorService.extractTextContent(document.filePath);
    const extraction = await anthropicService.extractFinancialData(
      classification.documentType,
      content
    );

    // Update document with extracted data
    await storage.updateDocument(document.id, {
      status: 'extracted',
      extractedData: extraction.extractedData,
    });

    node.output = extraction;
    workflow.globalState.extractedData = extraction;
  }

  private async executeGSTValidator(workflow: WorkflowState, node: LangGraphNode): Promise<void> {
    const extractedData = workflow.globalState.extractedData;
    const document = workflow.globalState.document;
    
    if (document.documentType !== 'gst') {
      node.output = { skipped: true, reason: 'Not a GST document' };
      return;
    }

    const validation = await complianceCheckerService.validateGSTCompliance(extractedData);
    
    const complianceCheck = await storage.createComplianceCheck({
      checkType: 'gst',
      documentId: document.id,
      status: validation.isCompliant ? 'compliant' : 'non_compliant',
      findings: validation,
      checkedBy: workflow.globalState.userId,
    });

    node.output = validation;
    workflow.globalState.complianceChecks.push(complianceCheck);
  }

  private async executeTDSValidator(workflow: WorkflowState, node: LangGraphNode): Promise<void> {
    const extractedData = workflow.globalState.extractedData;
    const document = workflow.globalState.document;
    
    if (document.documentType !== 'tds') {
      node.output = { skipped: true, reason: 'Not a TDS document' };
      return;
    }

    const validation = await complianceCheckerService.validateTDSCompliance(extractedData);
    
    const complianceCheck = await storage.createComplianceCheck({
      checkType: 'tds',
      documentId: document.id,
      status: validation.isCompliant ? 'compliant' : 'non_compliant',
      findings: validation,
      checkedBy: workflow.globalState.userId,
    });

    node.output = validation;
    workflow.globalState.complianceChecks.push(complianceCheck);
  }

  private async executeJournalBot(workflow: WorkflowState, node: LangGraphNode): Promise<void> {
    const extractedData = workflow.globalState.extractedData;
    const document = workflow.globalState.document;
    
    const journalEntries = await anthropicService.generateJournalEntries(extractedData);
    
    // Save journal entries to database
    for (const entry of journalEntries) {
      const journalEntry = await storage.createJournalEntry({
        ...entry,
        documentId: document.id,
        createdBy: workflow.globalState.userId,
      });
      workflow.globalState.journalEntries.push(journalEntry);
    }

    // Update document status
    await storage.updateDocument(document.id, {
      status: 'validated',
    });

    node.output = { journalEntries: journalEntries.length };
  }

  private async executeConsoAI(workflow: WorkflowState, node: LangGraphNode): Promise<void> {
    const journalEntries = workflow.globalState.journalEntries;
    
    // Generate financial statements
    const trialBalance = await financialReportsService.generateTrialBalance(journalEntries);
    const profitLoss = await financialReportsService.generateProfitLoss(journalEntries);
    const balanceSheet = await financialReportsService.generateBalanceSheet(journalEntries);

    // Save financial statements
    const statements = [
      { type: 'trial_balance', data: trialBalance },
      { type: 'profit_loss', data: profitLoss },
      { type: 'balance_sheet', data: balanceSheet },
    ];

    for (const statement of statements) {
      await storage.createFinancialStatement({
        statementType: statement.type,
        period: 'Q3_2025', // This should be dynamic based on data
        data: statement.data,
        generatedBy: workflow.globalState.userId,
      });
    }

    node.output = { statements: statements.length };
  }

  private async executeAuditAgent(workflow: WorkflowState, node: LangGraphNode): Promise<void> {
    const document = workflow.globalState.document;
    const journalEntries = workflow.globalState.journalEntries;
    
    // Perform final audit checks
    const auditFindings = await complianceCheckerService.performAuditChecks(
      document,
      journalEntries
    );

    // Update document to completed
    await storage.updateDocument(document.id, {
      status: 'completed',
    });

    node.output = auditFindings;
  }

  private findNextNode(workflow: WorkflowState): string | null {
    for (const [nodeId, node] of Object.entries(workflow.nodes)) {
      if (node.status === 'idle') {
        const dependenciesCompleted = node.dependencies.every(
          depId => workflow.nodes[depId].status === 'completed'
        );
        if (dependenciesCompleted) {
          return nodeId;
        }
      }
    }
    return null;
  }

  getWorkflowStatus(workflowId: string): WorkflowState | null {
    return this.workflows.get(workflowId) || null;
  }

  async getActiveWorkflows(): Promise<WorkflowState[]> {
    return Array.from(this.workflows.values()).filter(w => !w.completed);
  }
}

export const langGraphOrchestrator = new LangGraphOrchestrator();
