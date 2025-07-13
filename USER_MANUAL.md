# QRT Closure Agent Platform - User Manual

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Document Upload](#document-upload)
5. [Financial Reports](#financial-reports)
6. [Agent Workflows](#agent-workflows)
7. [Compliance Checking](#compliance-checking)
8. [Audit Trail](#audit-trail)
9. [Troubleshooting](#troubleshooting)
10. [Support](#support)

---

## Overview

The QRT Closure Agent Platform is an AI-powered financial automation system designed to streamline quarterly closure processes for Indian enterprises. The platform automatically processes financial documents, creates journal entries, and generates compliant financial statements according to Indian accounting standards.

### Key Features
- **Automated Document Processing**: Upload and classify 5 key document types
- **AI-Powered Journal Creation**: Automatic double-entry bookkeeping
- **Compliance Validation**: GST, TDS, Ind AS, and Companies Act 2013 compliance
- **Financial Reporting**: Trial balance, P&L, balance sheet, and cash flow statements
- **Audit Trail**: Complete transaction history and compliance tracking

### Supported Document Types
1. **Vendor Invoices** (PDF) - Purchase transactions from suppliers
2. **Sales Registers** (Excel) - Customer sales and revenue records
3. **Salary Registers** (Excel) - Employee compensation and payroll
4. **Bank Statements** (Excel/CSV) - Banking transactions and reconciliation
5. **Purchase Registers** (Excel) - Procurement and inventory transactions

---

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for AI processing
- Documents in supported formats (PDF, Excel, CSV)

### Navigation
The platform uses a sidebar navigation with the following sections:
- **Dashboard** - Overview and statistics
- **Document Upload** - File processing center
- **Financial Reports** - Generated statements and journal entries
- **Agent Workflows** - AI processing status
- **Compliance** - Regulatory validation
- **Audit Trail** - Transaction history

---

## Dashboard

The dashboard provides a comprehensive overview of your financial processing activities.

### Key Metrics
- **Documents Processed** - Total number of uploaded documents
- **Active Agents** - Currently running AI processes
- **Validation Errors** - Issues requiring attention
- **Compliance Score** - Overall regulatory compliance percentage

### Recent Activity
- Latest document uploads
- Completed processing workflows
- Compliance check results
- Generated financial statements

---

## Document Upload

### Upload Process
1. **Navigate** to the Document Upload page
2. **Drag and drop** files or click "Choose Files"
3. **Wait** for automatic processing (usually 15-30 seconds)
4. **View** classification results and extracted data

### File Requirements
- **Maximum Size**: 100MB per file
- **Supported Formats**: PDF, Excel (.xlsx), CSV
- **File Naming**: Descriptive names help with classification

### Document Processing Workflow
1. **Upload** - File is received and validated
2. **Classification** - AI identifies document type
3. **Data Extraction** - Key information is extracted
4. **Validation** - Compliance checks are performed
5. **Journal Creation** - Double-entry bookkeeping entries are generated

### Processing Status
- **Uploaded** - File received successfully
- **Processing** - AI analysis in progress
- **Classified** - Document type identified
- **Extracted** - Data extracted from document
- **Validated** - Compliance checks completed
- **Completed** - Journal entries created

---

## Financial Reports

### Available Reports

#### 1. Journal Entries
View all automatically created journal entries from your uploaded documents.

**Features:**
- Date and Journal ID tracking
- Account codes and names
- Debit and credit amounts
- Transaction narration
- Source document references

**Journal Entry Types by Document:**
- **Vendor Invoices**: Expense (Debit) + Accounts Payable (Credit)
- **Sales Registers**: Accounts Receivable (Debit) + Sales Revenue (Credit)
- **Salary Registers**: Salary Expense (Debit) + Salary Payable (Credit)
- **Purchase Registers**: Purchase Expense (Debit) + Accounts Payable (Credit)
- **Bank Statements**: Bank Account (Debit) + Miscellaneous Income (Credit)

#### 2. Trial Balance
A summary of all account balances ensuring debits equal credits.

**Features:**
- Account code and name
- Debit and credit balances
- Total verification
- Balance status indicator

#### 3. Profit & Loss Statement
Revenue and expense summary for the selected period.

**Components:**
- Revenue items (sales, service income)
- Expense items (cost of goods sold, operating expenses)
- Net profit/loss calculation

#### 4. Balance Sheet
Financial position statement showing assets, liabilities, and equity.

**Structure:**
- **Assets**: Current and fixed assets
- **Liabilities**: Current and long-term liabilities
- **Equity**: Share capital and retained earnings

### Report Generation
1. **Select Period** - Choose the reporting quarter (Q1, Q2, Q3, Q4)
2. **Click Generate** - AI processes all journal entries
3. **Download** - Export reports in Excel format
4. **Refresh** - Update data with latest entries

---

## Agent Workflows

The platform uses specialized AI agents to process documents through a structured workflow.

### AI Agent Types

#### 1. ClassifierBot
- **Purpose**: Identifies document type
- **Input**: Raw document file
- **Output**: Document classification and confidence score

#### 2. DataExtractor
- **Purpose**: Extracts structured data
- **Input**: Classified document
- **Output**: Key financial data in JSON format

#### 3. GSTValidator
- **Purpose**: Validates GST compliance
- **Input**: Extracted data
- **Output**: GST compliance report

#### 4. TDSValidator
- **Purpose**: Checks TDS compliance
- **Input**: Extracted data
- **Output**: TDS validation results

#### 5. JournalBot
- **Purpose**: Creates journal entries
- **Input**: Validated data
- **Output**: Double-entry bookkeeping entries

#### 6. ConsoAI
- **Purpose**: Generates financial statements
- **Input**: Journal entries
- **Output**: Trial balance, P&L, balance sheet

#### 7. AuditAgent
- **Purpose**: Final compliance validation
- **Input**: Complete financial data
- **Output**: Audit findings and recommendations

### Workflow Status
- **Idle** - Agent waiting for input
- **Running** - Processing in progress
- **Completed** - Successfully finished
- **Failed** - Error occurred
- **Paused** - Temporarily stopped

### Fallback Mechanism
If AI processing fails (due to API limits or errors), the system automatically:
1. Creates default journal entries based on document type
2. Maintains proper double-entry bookkeeping
3. Continues processing workflow
4. Notifies user of fallback activation

---

## Compliance Checking

### Regulatory Standards
The platform validates compliance with:

#### 1. GST (Goods and Services Tax)
- **GSTR-2A/3B Structure** - Input tax credit validation
- **Invoice Format** - Mandatory field verification
- **Tax Calculations** - Rate and amount accuracy
- **GSTIN Validation** - Supplier registration verification

#### 2. TDS (Tax Deducted at Source)
- **Form 26Q Structure** - Quarterly return format
- **Section Codes** - Correct TDS section application
- **Deduction Rates** - Statutory rate verification
- **PAN Validation** - Taxpayer identification

#### 3. Ind AS (Indian Accounting Standards)
- **Schedule III** - Balance sheet format compliance
- **Disclosure Requirements** - Mandatory note requirements
- **Accounting Principles** - Standard application verification

#### 4. Companies Act 2013
- **Statutory Requirements** - Legal compliance validation
- **Filing Obligations** - MCA submission requirements
- **Audit Standards** - Professional audit requirements

### Compliance Scoring
- **Compliant** (90-100%) - Meets all requirements
- **Minor Issues** (70-89%) - Some recommendations
- **Non-Compliant** (<70%) - Requires attention

### Running Compliance Checks
1. **Select Document** - Choose processed document
2. **Choose Check Type** - GST, TDS, Ind AS, or Companies Act
3. **Run Analysis** - AI performs compliance validation
4. **Review Results** - Address any identified issues

---

## Audit Trail

### Transaction Tracking
Complete history of all system activities including:
- Document uploads and processing
- Journal entry creation
- Financial statement generation
- Compliance check results
- User actions and timestamps

### Audit Information
- **Entity ID** - Unique transaction identifier
- **Action** - Type of activity performed
- **User** - Who performed the action
- **Timestamp** - When the action occurred
- **Details** - Additional context and data

### Compliance Benefits
- **Regulatory Compliance** - Meets audit requirements
- **Data Integrity** - Maintains transaction history
- **Accountability** - Tracks user actions
- **Forensic Analysis** - Supports investigation needs

---

## Troubleshooting

### Common Issues

#### Document Upload Problems
**Issue**: File upload fails
**Solution**: 
- Check file size (must be under 100MB)
- Verify file format (PDF, Excel, CSV only)
- Ensure stable internet connection

#### Processing Delays
**Issue**: Document processing takes too long
**Solution**:
- Wait for AI processing (can take 15-30 seconds)
- Check Agent Workflows for status
- Refresh page if stuck

#### Missing Journal Entries
**Issue**: No journal entries appear
**Solution**:
- Check if documents completed processing
- Verify document classification was successful
- Use Refresh button in Financial Reports

#### Compliance Errors
**Issue**: Compliance checks fail
**Solution**:
- Review document format and content
- Ensure all mandatory fields are present
- Check for data extraction errors

### Error Messages
- **"Rate Limit Exceeded"** - AI service temporarily unavailable, fallback system activated
- **"Validation Failed"** - Document format or content issues
- **"Processing Error"** - Internal system error, try again
- **"Unauthorized"** - Login session expired, please log in again

### Performance Tips
- **Batch Processing** - Upload multiple documents at once
- **File Optimization** - Use clear, well-structured documents
- **Regular Refresh** - Keep data current with refresh buttons
- **Monitor Status** - Check Agent Workflows for processing updates

---

## Support

### Getting Help
For technical support or questions:
1. Check this user manual first
2. Review the troubleshooting section
3. Contact your system administrator
4. Document any error messages for support

### Best Practices
- **Document Quality** - Use clear, readable documents
- **Consistent Naming** - Use descriptive file names
- **Regular Monitoring** - Check processing status regularly
- **Backup Important Data** - Keep copies of original documents

### System Updates
The platform is continuously updated with:
- New AI capabilities
- Enhanced compliance features
- Bug fixes and improvements
- Additional document type support

---

## Appendix

### Account Code Reference
- **EXPENSE** - General expense accounts
- **PAYABLE** - Amounts owed to suppliers
- **RECEIVABLE** - Amounts due from customers
- **SALES** - Revenue from sales transactions
- **SALARY** - Employee compensation
- **BANK** - Banking and cash transactions
- **PURCHASE** - Procurement transactions
- **MISC** - Miscellaneous transactions

### File Format Guidelines
- **PDF Documents** - Ensure text is searchable, not scanned images
- **Excel Files** - Use standard column headers and data formats
- **CSV Files** - Include header row with column names

### Security Notes
- All document processing is secure and encrypted
- User authentication is required for all actions
- Audit trails maintain data integrity
- Compliance with data protection regulations

---

*This manual covers the core functionality of the QRT Closure Agent Platform. For advanced features or custom configurations, please contact your system administrator.*

**Version**: 1.0  
**Last Updated**: July 2025  
**Platform**: QRT Closure Agent Platform