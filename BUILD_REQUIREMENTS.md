# QRT Closure Agent Platform - Build Requirements

## Project Overview

The QRT Closure Agent Platform is an AI-powered financial compliance and reporting platform designed specifically for quarterly closure processes in Indian enterprises. The system leverages intelligent document extraction and automated processing to deliver comprehensive financial insights with multitenant architecture.

## Core Functional Requirements

### 1. Document Processing & Data Ingestion
- **Intelligent Document Upload**: Support Excel (.xlsx), CSV (.csv), and PDF file formats up to 100MB
- **AI-Powered Classification**: Automatic document type detection using Anthropic Claude 4.0
- **Dynamic Format Recognition**: Handle any Excel format using AI to comprehend and normalize data into standardized structures
- **Content-Based Classification**: Analyze actual file content rather than relying on filenames
- **Document Types Support**: 
  - Vendor Invoices
  - Sales Registers (including itemized invoices)
  - Purchase Registers
  - Bank Statements
  - Salary Registers
  - Fixed Asset Registers
  - TDS Certificates

### 2. Itemized Invoice Processing
- **Line Item Detection**: AI-powered extraction of individual product/service line items from invoices
- **Dynamic Register Format**: Create "Item 1", "Item 2", "Item N" columns based on maximum items per invoice
- **Detailed Item Information**: Extract product descriptions, quantities, rates, amounts, and HSN codes
- **Expandable UI Display**: Click-to-expand invoice details with individual line item cards
- **Smart Detection**: Automatically identify itemized invoices and switch to specialized register view

### 3. Financial Reporting System
- **Trial Balance Generation**: Automated generation with perfect debit/credit validation
- **Profit & Loss Statement**: Complete P&L with revenue, expenses, and net income calculations
- **Balance Sheet**: Assets, liabilities, and equity reporting with proper account classification
- **Cash Flow Statement**: Operating, investing, and financing activities tracking
- **Itemized Sales Registers**: Specialized format matching Indian accounting standards

### 4. Compliance Engine
- **GST Compliance**: GSTR-2A/3B validation and reconciliation
- **TDS Compliance**: Form 26Q structure validation and TDS calculations
- **IndAS Compliance**: Indian Accounting Standards validation
- **Companies Act 2013**: Statutory compliance checks and audit trails

### 5. AI Agent System
- **Multi-Agent Workflow**: 7 specialized AI agents for different tasks
- **LangGraph Orchestration**: Workflow management for complex document processing
- **Agent Types**:
  - ClassifierBot: Document type classification
  - DataExtractor: Tabular data extraction
  - GSTValidator: GST compliance validation
  - TDSValidator: TDS deduction validation
  - JournalBot: Double-entry journal entry generation
  - ConsoAI: Consolidated financial statement generation
  - AuditAgent: Final audit checks and validation

### 6. Multitenant Architecture
- **Complete Data Isolation**: Row-level security with tenant_id foreign keys
- **User Management**: Role-based access control (admin, finance_manager, finance_exec, auditor, viewer)
- **Subscription Management**: Multiple subscription plans per tenant
- **Authentication**: JWT-based authentication with secure token management

## Technical Architecture Requirements

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter (lightweight React router)
- **UI Library**: Radix UI with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Stack
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL via Neon serverless with Drizzle ORM
- **Authentication**: JWT-based authentication middleware
- **File Processing**: XLSX library for Excel processing, CSV parsing, PDF text extraction
- **AI Integration**: Anthropic Claude API for document analysis and classification

### Database Requirements
- **ORM**: Drizzle ORM with TypeScript integration
- **Migration System**: Drizzle migrations for schema management
- **Core Tables**:
  - users (authentication and user data)
  - tenants (multitenant organization data)
  - documents (uploaded file metadata)
  - standardized_transactions (normalized transaction data)
  - journal_entries (double-entry accounting records)
  - financial_statements (generated reports)
  - compliance_checks (regulatory validation results)
  - audit_trail (system activity logging)

### AI & Machine Learning
- **Primary AI Provider**: Anthropic Claude 4.0 Sonnet for document analysis
- **Document Classification**: Content-based classification with confidence scoring
- **Data Extraction**: Intelligent column mapping and data standardization
- **Financial Logic**: Automated journal entry generation following Indian accounting standards
- **Validation**: AI-powered compliance checks for GST, TDS, and statutory requirements

## Detailed Implementation Requirements

### 1. Document Upload & Processing
```typescript
// File upload with validation
- Support drag-and-drop interface
- Real-time upload progress indicators
- MIME type validation for security
- File size limits (100MB max)
- Virus scanning integration (optional)
- Automatic backup to cloud storage
```

### 2. Intelligent Data Extraction
```typescript
// AI-powered data extraction pipeline
- Excel structure analysis (headers in Row 4, data from Row 5+)
- Dynamic column mapping based on content analysis
- Fallback mechanisms for unusual formats
- Confidence scoring for extraction quality
- Manual review interface for low-confidence extractions
```

### 3. Itemized Invoice System
```typescript
// Specialized itemized invoice handling
- Line item detection algorithm
- Product description parsing
- Quantity and unit extraction
- Rate and amount calculations
- HSN code identification
- Dynamic table generation with variable item columns
```

### 4. Financial Calculations
```typescript
// Accounting logic implementation
- Double-entry bookkeeping validation
- Account code mapping (1xxx=Assets, 2xxx=Liabilities, etc.)
- Currency formatting for Indian Rupees
- Tax calculations (GST, TDS)
- Depreciation calculations for assets
- Period-based reporting (quarterly, annually)
```

### 5. Compliance Validation
```typescript
// Regulatory compliance checks
- GST number validation
- PAN format verification
- TDS section code validation
- Companies Act 2013 requirements
- Audit trail maintenance
- Statutory report generation
```

## Security Requirements

### 1. Authentication & Authorization
- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Session management and timeout
- Multi-factor authentication (optional)

### 2. Data Security
- Tenant data isolation
- SQL injection prevention via ORM
- File upload security validation
- HTTPS enforcement
- Environment variable protection for API keys

### 3. Audit & Compliance
- Complete audit trail logging
- User activity tracking
- Document access logging
- Compliance report generation
- Data retention policies

## Performance Requirements

### 1. Response Times
- Document upload: < 2 seconds
- Data extraction: < 5 seconds for typical Excel files
- Financial report generation: < 1 second
- AI classification: < 3 seconds
- Page load times: < 1 second

### 2. Scalability
- Support for 1000+ concurrent users
- Handle files up to 100MB
- Process 10,000+ transactions per document
- Multitenant architecture for unlimited companies
- Horizontal scaling capability

### 3. Reliability
- 99.9% uptime requirement
- Automatic error recovery
- Data backup and disaster recovery
- Graceful degradation for AI service outages

## Integration Requirements

### 1. External APIs
- **Anthropic Claude API**: Document analysis and classification
- **Banking APIs**: Direct bank statement import (future)
- **GST Portal Integration**: Real-time GST validation (future)
- **MCA Portal Integration**: Company data verification (future)

### 2. File Format Support
- **Excel**: .xlsx files with dynamic structure recognition
- **CSV**: Standard comma-separated values
- **PDF**: Text extraction for invoice processing
- **JSON**: API data import/export

### 3. Export Capabilities
- PDF report generation
- Excel export for all data tables
- CSV export for accounting software integration
- JSON API for third-party integrations

## Development Environment Setup

### 1. Prerequisites
```bash
# Required software
- Node.js 18+ with npm
- PostgreSQL 14+
- Git for version control
- TypeScript 5+
- Anthropic API key
```

### 2. Development Stack
```bash
# Core dependencies
- React 18 + TypeScript
- Express.js + TypeScript
- Drizzle ORM + PostgreSQL
- Vite build tool
- Tailwind CSS + Radix UI
- TanStack Query
```

### 3. Environment Variables
```bash
# Required environment variables
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
SESSION_SECRET=your-secret-key
NODE_ENV=development
PORT=5000
```

## Deployment Requirements

### 1. Platform Compatibility
- **Primary**: Replit deployment with automatic builds
- **Alternative**: AWS, Google Cloud, Azure deployment capability
- **Docker**: Containerization support for any platform

### 2. Production Configuration
- Database connection pooling
- CDN for static assets
- Load balancing for high availability
- Monitoring and logging integration
- Automated backup systems

### 3. Scaling Considerations
- Horizontal scaling with load balancers
- Database read replicas for performance
- Caching layer (Redis) for frequent queries
- File storage optimization (S3 compatible)

## Quality Assurance Requirements

### 1. Testing Framework
- Unit tests for all business logic
- Integration tests for API endpoints
- End-to-end tests for user workflows
- Performance testing for large files
- Security penetration testing

### 2. Code Quality
- TypeScript strict mode enforcement
- ESLint and Prettier code formatting
- Code coverage minimum 80%
- Automated testing in CI/CD pipeline
- Documentation for all public APIs

### 3. User Experience
- Responsive design for mobile/tablet
- Accessibility compliance (WCAG 2.1)
- Error handling with user-friendly messages
- Loading states and progress indicators
- Offline capability for basic features

## Maintenance & Support

### 1. Monitoring
- Application performance monitoring
- Error tracking and alerting
- User activity analytics
- System health dashboards
- Automated backup verification

### 2. Updates & Patches
- Regular security updates
- Feature enhancement rollouts
- Database migration procedures
- API versioning strategy
- Backward compatibility maintenance

### 3. Documentation
- Technical architecture documentation
- API documentation with examples
- User manual and tutorials
- Deployment guides
- Troubleshooting procedures

This comprehensive requirements document provides the foundation for building the QRT Closure Agent Platform from scratch, covering all technical, functional, and operational aspects needed for successful implementation.