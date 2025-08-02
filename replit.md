# QRT Closure Agent Platform

## Overview

This is a financial automation platform designed to streamline quarterly closure processes for Indian companies. Its primary purpose is to leverage AI agents to automatically classify, extract, validate, and process financial documents, ensuring compliance with Indian accounting standards. The project aims to provide comprehensive financial analysis, reporting, and compliance capabilities for businesses, facilitating accurate and efficient financial management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application employs a modern full-stack architecture with distinct frontend, backend, and shared components.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **UI Components**: Radix UI with shadcn/ui design system
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Python 3.11 with FastAPI
- **Language**: Python with async/await
- **Database**: PostgreSQL via Neon serverless with SQLAlchemy ORM
- **Authentication**: JWT-based authentication
- **File Processing**: Python libraries (pandas, openpyxl, PyPDF2)
- **AI Integration**: Anthropic Claude API + OpenAI API
- **Migration**: Alembic

### Key Design Decisions
- **Monorepo Structure**: Organized with `client/`, `server/`, and `shared/` directories.
- **TypeScript Throughout**: Ensures type safety across all layers.
- **Shared Schema**: Common data types and database schema definitions.
- **AI-First Architecture**: Utilizes LangGraph for orchestrating multi-agent workflows.
- **Serverless Database**: Leverages Neon PostgreSQL for scalability.
- **UI/UX**: Features a clean, professional, tabbed interface with collapsible navigation, real-time data display, and professional Indian rupee formatting. It also includes comprehensive calculation transparency with toggleable logs and dynamic itemized register display.

### Core Features
- **Document Processing Pipeline**: Handles file upload (Excel, CSV, PDF), AI-powered classification, structured data extraction, and multi-layer validation.
- **AI Agent System**: Includes specialized agents like ClassifierBot, DataExtractor, GSTValidator, TDSValidator, JournalBot, ConsoAI, and AuditAgent for various financial tasks.
- **Financial Reporting**: Generates Trial Balance, Profit & Loss Statement, Balance Sheet, and Cash Flow statements.
- **Compliance Engine**: Supports GST, TDS, IndAS, and Companies Act 2013 compliance validation.
- **Data Flow**: Documents are uploaded, processed in a queue, classified, data is extracted and validated, journal entries are generated, and reports are made available, with all actions logged for audit.
- **Itemization System**: AI-powered invoice itemization with expandable UI.
- **AI-Powered Transaction Narration**: Replaces static templates with intelligent, contextual narrations.
- **Validation Agents**: Includes ValidatorAgent for sanity checks and ProvisionBot for identifying missing adjustments.
- **Bank Reconciliation**: Comprehensive bank reconciliation functionality.
- **Purchase Register System**: Full purchase register implementation with reconciliation and duplicate detection.
- **Conversational AI Chat System**: Natural language query capabilities for financial data analysis.
- **Content-Based Classification**: Uses actual file content for document classification.
- **Master Data**: Manages authentic Indian GL codes and TDS sections.
- **Data Source Configuration**: Comprehensive management for various connection types.
- **Individual Agent Configuration**: Allows fine-tuning of AI parameters for each specialized agent.
- **Admin Panel**: Provides user and tenant management with role-based access control.

## External Dependencies

### Core Dependencies
- **Anthropic AI SDK (@anthropic-ai/sdk)**: For AI processing and document analysis.
- **Neon Database (@neondatabase/serverless)**: For PostgreSQL database connectivity.
- **Drizzle ORM (drizzle-orm)**: For type-safe database operations.
- **Express (express)**: Web server framework (used in initial refactoring, but backend is now FastAPI).
- **TanStack Query (@tanstack/react-query)**: For client-side data fetching and caching.

### UI Dependencies
- **Radix UI (@radix-ui/react-***): Headless UI components.
- **Tailwind CSS (tailwindcss)**: Utility-first CSS framework.
- **Lucide React (lucide-react)**: Icon library.
- **Wouter (wouter)**: Lightweight routing solution.

### Development Dependencies
- **Vite (vite)**: Build tool and development server.
- **TypeScript (typescript)**: Static type checking.
- **Drizzle Kit (drizzle-kit)**: Database migration tool (used in initial refactoring).

### Backend Specific Libraries (Python)
- **FastAPI**: Web framework.
- **SQLAlchemy**: ORM for database interaction.
- **pandas, openpyxl, PyPDF2**: For file processing.
- **Alembic**: For database migrations.
- **OpenAI API**: For additional AI capabilities.
```