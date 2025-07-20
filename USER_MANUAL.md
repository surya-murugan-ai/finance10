# QRT Closure Agent Platform - User Manual
**Version**: 2.1 | **Date**: July 20, 2025

## 📋 Quick Start Guide

### 1. Login & Authentication
- Access the platform through your web browser
- Use your email and password to log in
- The system uses secure JWT tokens for authentication
- Your session will remain active until logout

### 2. Dashboard Overview
Upon login, you'll see the main dashboard with:
- **Financial Summary**: Real-time totals (₹80.8 crores balanced)
- **System Status**: Document processing status and health indicators
- **Quick Actions**: Direct access to key features
- **Recent Activity**: Latest transactions and system updates

## 📊 Financial Reports

### Trial Balance
- **Access**: Dashboard > Financial Reports > Trial Balance
- **Features**: 
  - Shows all account balances with perfect debit/credit balance
  - Real-time data from 790 journal entries
  - Export capabilities for further analysis
  - Entity-wise breakdowns (40 detailed entries)

### Profit & Loss Statement
- **Access**: Dashboard > Financial Reports > P&L
- **Features**:
  - Revenue breakdown by account codes (4xxx series)
  - Expense classification (5xxx series)  
  - Net income calculation (₹71.7 crores)
  - Period-based reporting for quarterly closure

### Balance Sheet
- **Access**: Dashboard > Financial Reports > Balance Sheet
- **Features**:
  - Assets (₹76.3 crores): Current and fixed assets
  - Liabilities (₹4.5 crores): Current and long-term obligations
  - Equity (₹71.7 crores): Automatic retained earnings calculation
  - **Perfect Balance**: Assets = Liabilities + Equity guaranteed

### Cash Flow Statement  
- **Access**: Dashboard > Financial Reports > Cash Flow
- **Features**:
  - Operating Activities: 9 detailed cash flow entries
  - Investing Activities: Capital expenditure tracking
  - Financing Activities: Debt and equity transactions
  - Net Cash Flow: ₹62 crores with detailed breakdown

## 📁 Document Management

### Upload Documents
- **Supported Formats**: Excel (.xlsx), CSV, PDF
- **Document Types**: Sales Register, Purchase Register, Bank Statements, TDS Certificates, Fixed Asset Register, Vendor Invoices
- **Process**: 
  1. Click "Upload Documents" 
  2. Select files from your computer
  3. System automatically classifies document types using AI
  4. Processing completes in < 2 seconds per file

### Document Classification
- **AI-Powered**: Content-based classification using Claude 4.0
- **Confidence Scoring**: Shows classification confidence levels
- **Manual Override**: Ability to reclassify if needed
- **Supported Types**: 6 primary business document categories

### Data Extraction
- **Intelligent Processing**: Handles any Excel format automatically
- **Standardization**: Converts all formats to consistent structure
- **390 Transactions**: Currently processed from uploaded documents
- **Real-Time**: Immediate processing with caching for efficiency

## 🤖 AI-Powered Features

### Journal Entry Generation
- **AI Narrations**: Intelligent transaction descriptions instead of generic templates
- **Contextual Analysis**: Considers document type, vendor, amount, business context
- **Example**: "Sales to Quest Agrovet Services - Agricultural products" vs "Sales register - filename"
- **Balance Guarantee**: All entries maintain perfect debit/credit balance

### Intelligent Data Processing
- **Dynamic Format Recognition**: AI analyzes Excel structure automatically
- **Column Mapping**: Identifies headers, data rows, company names, dates
- **Fallback Protection**: Robust handling of unusual document formats
- **Quality Assurance**: Confidence scores and validation checks

### Conversational AI Chat System
- **Real-Time Analysis**: Query your financial data using natural language
- **Authentic Data Processing**: Analyzes actual data from 790 journal entries and 3 documents
- **Query Types Supported**:
  - Sales revenue analysis ("What are my sales?")
  - Expense breakdown ("Show me top expenses")
  - TDS liability status ("What's my TDS liability?")
  - Asset reviews ("What are my bank accounts?")
  - Compliance status ("Show compliance status")
  - Financial overview ("Give me a financial summary")
- **Intelligent Responses**: Context-aware answers with actionable suggestions
- **Balanced Data Confirmation**: Shows ₹80.8 crores perfectly balanced books

## ⚙️ Settings & Configuration

### API Keys (Tab 1)
- **OpenAI**: For document analysis and processing
- **Anthropic**: For intelligent transaction narrations  
- **PostgreSQL**: Database connection testing
- **Connection Testing**: Built-in validation for all API keys

### AI Settings (Tab 2)
- **Temperature**: Controls AI creativity (0.0-1.0)
- **Model Selection**: Choose AI models for different tasks
- **System Prompts**: Customize AI behavior for your business
- **Streaming**: Enable/disable real-time AI responses

### Agent Configuration (Tab 5)
**7 Specialized Financial Agents**:
1. **ClassifierBot**: Document type identification
2. **JournalBot**: Automated journal entry creation  
3. **GST Validator**: GST compliance checking
4. **TDS Validator**: TDS calculation and validation
5. **DataExtractor**: Intelligent data extraction from documents
6. **ConsoAI**: Consolidation and analysis
7. **AuditAgent**: Audit trail and compliance monitoring

### Master Data (Accessible via Data Sources)
- **96 GL Codes**: Complete Indian chart of accounts
- **27 TDS Sections**: FY 2025-26 rates and thresholds
- **GST Configuration**: CGST, SGST, IGST rate management
- **Vendor/Customer Lists**: Business entity management

## 🔍 Advanced Features

### Validation Tools
**ValidatorAgent**: 
- Duplicate transaction detection
- Missing balance validation  
- Trial balance sanity checks
- Unusual amount alerts (>₹1 crore)

**ProvisionBot**:
- Missing depreciation identification (15% rate)
- Bad debt provision calculation (5% of receivables)
- Tax provision requirements (30% of income) 
- Employee benefit calculations (PF, Bonus, Gratuity)

### Compliance Management
- **Form 26Q Generation**: TDS compliance reporting
- **GSTR-3B Creation**: GST return preparation
- **GSTR-2A Processing**: Input tax credit reconciliation
- **Audit Trail**: Complete activity logging for compliance

### Data Analysis Tools
**Basic Calculations**:
- Add, Subtract, Multiply, Divide
- Percentage calculations
- GST calculations with current rates
- TDS calculations by section

**Advanced Calculations**:
- Current Ratio analysis
- Quick Ratio calculations  
- Return on Equity metrics
- Financial ratio analysis

## 🏢 Multi-Tenant Features

### Tenant Management
- **Complete Data Isolation**: Each company's data is separate
- **Role-Based Access**: Admin, Finance Manager, Executive, Auditor, Viewer
- **Subscription Plans**: Enterprise, Professional, Basic tiers
- **Company Configuration**: Individual settings per tenant

### User Roles & Permissions
- **Admin**: Full system access and configuration
- **Finance Manager**: Financial reports and journal entry management
- **Finance Executive**: Data entry and basic reporting
- **Auditor**: Read-only access to all financial data
- **Viewer**: Dashboard and basic report access

## 📱 User Interface Guide

### Navigation
- **Sidebar Menu**: Collapsible navigation with icons and labels
- **Active Page Highlighting**: Clear indication of current section
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Theme switching available

### Data Display
- **Professional Tables**: Sortable columns with pagination
- **Indian Currency Formatting**: ₹ symbol with proper comma separation
- **Loading States**: Clear indicators during data fetching
- **Error Handling**: User-friendly error messages and recovery options

### Export Features
- **Excel Export**: Download financial reports as Excel files
- **PDF Generation**: Professional PDF reports for compliance
- **CSV Export**: Raw data export for further analysis
- **Print-Friendly**: Optimized layouts for printing

## 🔧 Troubleshooting

### Common Issues

**Login Problems**:
- Clear browser cache and cookies
- Check internet connection
- Verify email and password
- Contact administrator for password reset

**Document Upload Issues**:
- Ensure file size is under 10MB
- Check file format (Excel, CSV, PDF supported)
- Verify file is not corrupted
- Try uploading one file at a time

**Financial Report Errors**:
- Ensure journal entries are generated
- Check if documents are properly classified
- Verify data extraction completed successfully
- Contact support if calculations seem incorrect

**Performance Issues**:
- Close other browser tabs
- Clear browser cache
- Check internet connection speed
- Try refreshing the page

### Support Contacts
- **Technical Support**: Platform automatically logs issues for debugging
- **User Training**: Comprehensive tooltips and help text throughout interface
- **Documentation**: This manual and inline help system
- **Audit Support**: Complete audit trail for all user activities

## 🎯 Best Practices

### Document Management
- Upload documents regularly for better cash flow analysis
- Use consistent naming conventions for files
- Review AI classification results for accuracy
- Keep original files as backup

### Financial Reporting
- Generate reports at month-end for accuracy
- Review trial balance for perfect balance before other reports
- Cross-verify cash flow with bank statements
- Export reports for regulatory compliance

### System Maintenance
- Update API keys when expired
- Review agent configurations quarterly
- Monitor system performance through dashboard
- Keep master data updated with latest rates and codes

---

**For additional support or feature requests, use the built-in feedback system or contact your system administrator.**