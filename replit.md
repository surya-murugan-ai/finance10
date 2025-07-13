# QRT Closure Agent Platform

## Overview

This is a financial automation platform built to streamline quarterly closure processes for Indian companies. The system leverages AI agents powered by Anthropic's Claude to automatically classify, extract, validate, and process financial documents while ensuring compliance with Indian accounting standards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend, backend, and shared components:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **UI Components**: Radix UI with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL via Neon serverless with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **File Processing**: Multer for file uploads with in-memory storage
- **AI Integration**: Anthropic Claude API for document processing

### Key Design Decisions

1. **Monorepo Structure**: Single repository with `client/`, `server/`, and `shared/` directories for code organization
2. **TypeScript Throughout**: Full type safety across frontend, backend, and shared schemas
3. **Shared Schema**: Common data types and database schema definitions in `shared/` directory
4. **AI-First Architecture**: LangGraph orchestration for multi-agent workflows
5. **Serverless Database**: Neon PostgreSQL for scalability and reduced operational overhead

## Key Components

### Document Processing Pipeline
- **File Upload**: Supports Excel, CSV, and PDF files up to 100MB
- **Classification**: AI-powered document type detection (Journal, GST, TDS, etc.)
- **Data Extraction**: Structured data extraction from various file formats
- **Validation**: Multi-layer validation for compliance and accuracy

### AI Agent System
- **ClassifierBot**: Document type classification using LLM analysis
- **DataExtractor**: Tabular data extraction from documents
- **GSTValidator**: GST compliance validation and calculations
- **TDSValidator**: TDS deduction validation and compliance checks
- **JournalBot**: Double-entry journal entry generation
- **ConsoAI**: Consolidated financial statement generation
- **AuditAgent**: Final audit checks and validation

### Financial Reporting
- **Trial Balance**: Automated generation with debit/credit validation
- **P&L Statement**: Profit and loss statement compilation
- **Balance Sheet**: Asset, liability, and equity reporting
- **Cash Flow**: Operating, investing, and financing activities

### Compliance Engine
- **GST Compliance**: GSTR-2A/3B validation and reconciliation
- **TDS Compliance**: Form 26Q structure validation
- **IndAS Compliance**: Indian Accounting Standards validation
- **Companies Act 2013**: Statutory compliance checks

## Data Flow

1. **Document Upload**: Users upload financial documents via web interface
2. **Queue Processing**: Files are queued for AI agent processing
3. **Classification**: Documents are automatically classified by type
4. **Data Extraction**: Relevant data is extracted and structured
5. **Validation**: Multiple validation layers ensure accuracy and compliance
6. **Journal Generation**: Double-entry journal entries are created
7. **Financial Reporting**: Reports are generated and made available
8. **Audit Trail**: All actions are logged for compliance tracking

## External Dependencies

### Core Dependencies
- **@anthropic-ai/sdk**: AI processing and document analysis
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **express**: Web server framework
- **@tanstack/react-query**: Client-side data fetching and caching

### UI Dependencies
- **@radix-ui/react-***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight routing solution

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **drizzle-kit**: Database migration tool

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express API
- **Hot Reload**: Full-stack hot reloading support
- **Database**: Neon PostgreSQL with connection pooling

### Production Deployment
- **Build Process**: Vite builds client assets, esbuild bundles server
- **Database Migrations**: Drizzle migrations for schema changes
- **Environment Variables**: DATABASE_URL, ANTHROPIC_API_KEY, SESSION_SECRET
- **File Storage**: Local filesystem (can be extended to S3)

### Security Considerations
- **Authentication**: Replit Auth with session management
- **File Validation**: MIME type and size validation
- **SQL Injection**: Drizzle ORM provides protection
- **CORS**: Configured for development and production environments

The application is designed to be deployed on Replit but can be adapted for other platforms with minimal configuration changes.