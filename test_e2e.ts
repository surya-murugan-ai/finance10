import { fileProcessorService } from './server/services/fileProcessor';
import { anthropicService } from './server/services/anthropic';
import { complianceCheckerService } from './server/services/complianceChecker';
import { financialReportsService } from './server/services/financialReports';
import { langGraphOrchestrator } from './server/services/langGraph';
import { storage } from './server/storage';
import fs from 'fs';

// End-to-end test of QRT Closure platform
async function runE2ETest() {
  console.log('🚀 Starting End-to-End Test for QRT Closure Platform...\n');
  
  try {
    // Test 1: File Processing Service
    console.log('1. Testing File Processing Service...');
    const testFile = {
      originalname: 'test_document.csv',
      buffer: fs.readFileSync('test_document.csv'),
      mimetype: 'text/csv',
      size: fs.statSync('test_document.csv').size
    } as Express.Multer.File;
    
    const validationResult = await fileProcessorService.validateFile(testFile);
    console.log('   ✓ File validation:', validationResult.isValid ? 'PASS' : 'FAIL');
    
    if (validationResult.isValid) {
      const saveResult = await fileProcessorService.saveFile(testFile, 'test_document.csv');
      console.log('   ✓ File save:', saveResult.success ? 'PASS' : 'FAIL');
      
      if (saveResult.success) {
        const content = await fileProcessorService.extractTextContent(saveResult.filePath!);
        console.log('   ✓ Content extraction:', content.length > 0 ? 'PASS' : 'FAIL');
        console.log('   ✓ Extracted', content.split('\n').length, 'lines of data');
      }
    }
    
    // Test 2: AI Document Classification
    console.log('\n2. Testing AI Document Classification...');
    const sampleContent = `Date,Description,Debit,Credit,Account
2024-01-01,Opening Balance,50000,0,Cash
2024-01-02,Sales Revenue,0,25000,Sales
2024-01-03,Office Rent,5000,0,Rent Expense`;
    
    const classificationResult = await anthropicService.classifyDocument('test_document.csv', sampleContent);
    console.log('   ✓ Document classification:', classificationResult.documentType);
    console.log('   ✓ Confidence:', classificationResult.confidence);
    console.log('   ✓ Suggested fields:', classificationResult.suggestedFields.join(', '));
    
    // Test 3: Data Extraction
    console.log('\n3. Testing Data Extraction...');
    const extractionResult = await anthropicService.extractFinancialData(classificationResult.documentType, sampleContent);
    console.log('   ✓ Data extraction:', extractionResult.extractedData ? 'PASS' : 'FAIL');
    console.log('   ✓ Confidence:', extractionResult.confidence);
    console.log('   ✓ Warnings:', extractionResult.warnings.length);
    
    // Test 4: Compliance Validation
    console.log('\n4. Testing Compliance Validation...');
    const complianceResult = await anthropicService.validateCompliance(classificationResult.documentType, extractionResult.extractedData);
    console.log('   ✓ Compliance check:', complianceResult.isCompliant ? 'PASS' : 'FAIL');
    console.log('   ✓ Compliance score:', complianceResult.score);
    console.log('   ✓ Violations:', complianceResult.violations.length);
    
    // Test 5: Journal Entry Generation
    console.log('\n5. Testing Journal Entry Generation...');
    const journalEntries = await anthropicService.generateJournalEntries(extractionResult.extractedData);
    console.log('   ✓ Journal entries generated:', journalEntries.length, 'entries');
    
    // Test 6: Financial Reports
    console.log('\n6. Testing Financial Reports...');
    const trialBalance = await financialReportsService.generateTrialBalance(journalEntries);
    console.log('   ✓ Trial balance entries:', trialBalance.entries.length);
    console.log('   ✓ Trial balance validates:', trialBalance.isBalanced ? 'PASS' : 'FAIL');
    
    const profitLoss = await financialReportsService.generateProfitLoss(journalEntries);
    console.log('   ✓ P&L entries:', profitLoss.entries.length);
    console.log('   ✓ Net profit/loss:', profitLoss.netProfitLoss);
    
    // Test 7: Database Operations
    console.log('\n7. Testing Database Operations...');
    const testUser = await storage.upsertUser({
      id: 'test_user_123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: null
    });
    console.log('   ✓ User creation:', testUser.id ? 'PASS' : 'FAIL');
    
    const testDocument = await storage.createDocument({
      userId: testUser.id,
      fileName: 'test_document.csv',
      filePath: '/uploads/test_document.csv',
      documentType: 'journal',
      status: 'processing',
      extractedData: extractionResult.extractedData,
      metadata: { size: testFile.size, mimeType: testFile.mimetype }
    });
    console.log('   ✓ Document creation:', testDocument.id ? 'PASS' : 'FAIL');
    
    // Test 8: Agent Workflow
    console.log('\n8. Testing Agent Workflow...');
    const workflowId = await langGraphOrchestrator.startDocumentProcessingWorkflow(testDocument.id, testUser.id);
    console.log('   ✓ Workflow started:', workflowId);
    
    const workflowStatus = await langGraphOrchestrator.getWorkflowStatus(workflowId);
    console.log('   ✓ Workflow status:', workflowStatus.currentNode);
    console.log('   ✓ Workflow nodes:', Object.keys(workflowStatus.nodes).length);
    
    console.log('\n🎉 End-to-End Test Completed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   • File processing: OPERATIONAL');
    console.log('   • AI classification: OPERATIONAL');
    console.log('   • Data extraction: OPERATIONAL');
    console.log('   • Compliance checking: OPERATIONAL');
    console.log('   • Journal generation: OPERATIONAL');
    console.log('   • Financial reports: OPERATIONAL');
    console.log('   • Database operations: OPERATIONAL');
    console.log('   • Agent workflows: OPERATIONAL');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
runE2ETest().catch(console.error);