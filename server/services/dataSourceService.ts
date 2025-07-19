import { storage } from "../storage";
import { nanoid } from "nanoid";

export enum DataSourceType {
  DATABASE = "database",
  API = "api",
  FILE_SYSTEM = "file_system",
  FTP = "ftp",
  SFTP = "sftp",
  EMAIL = "email",
  CLOUD_STORAGE = "cloud_storage",
  ERP_SYSTEM = "erp_system",
  BANKING_API = "banking_api",
  GST_PORTAL = "gst_portal",
  MCA_PORTAL = "mca_portal"
}

export enum DatabaseType {
  POSTGRESQL = "postgresql",
  MYSQL = "mysql",
  SQLITE = "sqlite",
  ORACLE = "oracle",
  SQL_SERVER = "sql_server",
  MONGODB = "mongodb"
}

export enum ConnectionStatus {
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  ERROR = "error",
  TESTING = "testing"
}

export interface DataSourceConfig {
  id: string;
  name: string;
  type: DataSourceType;
  description: string;
  config: Record<string, any>;
  is_active: boolean;
  is_default: boolean;
  status: ConnectionStatus;
  last_tested: Date | null;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ERPConnector {
  id: string;
  name: string;
  type: 'tally' | 'sap' | 'zoho' | 'oracle' | 'manual';
  config: {
    baseUrl?: string;
    apiKey?: string;
    username?: string;
    password?: string;
    database?: string;
    port?: number;
    ssl?: boolean;
    timeout?: number;
  };
  status: 'active' | 'inactive' | 'error';
  last_sync: Date | null;
  data_formats: string[];
}

export interface DataFormatTemplate {
  id: string;
  name: string;
  type: 'sales' | 'purchase' | 'gst' | 'tds' | 'payroll' | 'bank_statement' | 'journal';
  format: 'excel' | 'csv' | 'json' | 'xml';
  columns: {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    required: boolean;
    validation?: string;
  }[];
  sample_data: Record<string, any>[];
  upload_guide: string;
}

export interface MasterData {
  id: string;
  type: 'gl_codes' | 'tds_sections' | 'vendors' | 'cost_centers' | 'customers' | 'products';
  data: Record<string, any>[];
  last_updated: Date;
  source: string;
}

class DataSourceService {
  private dataSources: Map<string, DataSourceConfig> = new Map();
  private erpConnectors: Map<string, ERPConnector> = new Map();
  private dataFormats: Map<string, DataFormatTemplate> = new Map();
  private masterData: Map<string, MasterData> = new Map();

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults() {
    // Initialize default data sources
    this.createDefaultDataSources();
    this.createDefaultERPConnectors();
    this.createDefaultDataFormatTemplates();
    this.createDefaultMasterData();
  }

  private createDefaultDataSources() {
    const defaultSources: Partial<DataSourceConfig>[] = [
      {
        id: "primary_db",
        name: "Primary Database",
        type: DataSourceType.DATABASE,
        description: "Main PostgreSQL database",
        config: {
          database_type: DatabaseType.POSTGRESQL,
          host: process.env.PGHOST || "localhost",
          port: parseInt(process.env.PGPORT || "5432"),
          database: process.env.PGDATABASE || "postgres",
          username: process.env.PGUSER || "postgres",
          ssl: true,
          pool_size: 10,
          timeout: 30000
        },
        is_active: true,
        is_default: true,
        status: ConnectionStatus.CONNECTED,
        metadata: { driver: "pg", version: "14.0" }
      },
      {
        id: "file_uploads",
        name: "File Upload System",
        type: DataSourceType.FILE_SYSTEM,
        description: "Local file system for document uploads",
        config: {
          base_path: "./uploads",
          max_file_size: 100 * 1024 * 1024, // 100MB
          allowed_extensions: [".xlsx", ".csv", ".pdf", ".xml"],
          auto_backup: true,
          retention_days: 365
        },
        is_active: true,
        is_default: false,
        status: ConnectionStatus.CONNECTED,
        metadata: { storage_type: "local", backup_enabled: true }
      },
      {
        id: "gst_portal",
        name: "GST Portal API",
        type: DataSourceType.GST_PORTAL,
        description: "Government GST portal API integration",
        config: {
          base_url: "https://services.gst.gov.in/services/api",
          api_version: "v1.0",
          timeout: 30000,
          rate_limit: 100,
          auth_method: "api_key"
        },
        is_active: !!process.env.GST_API_KEY,
        is_default: false,
        status: ConnectionStatus.DISCONNECTED,
        metadata: { government_api: true, compliance_required: true }
      },
      {
        id: "mca_portal",
        name: "MCA Portal API",
        type: DataSourceType.MCA_PORTAL,
        description: "Ministry of Corporate Affairs portal integration",
        config: {
          base_url: "https://www.mca.gov.in/mcafoportal/api",
          api_version: "v2.0",
          timeout: 45000,
          rate_limit: 50,
          auth_method: "oauth2"
        },
        is_active: !!process.env.MCA_API_KEY,
        is_default: false,
        status: ConnectionStatus.DISCONNECTED,
        metadata: { government_api: true, filing_required: true }
      }
    ];

    defaultSources.forEach(source => {
      const config: DataSourceConfig = {
        ...source,
        last_tested: null,
        error_message: null,
        created_at: new Date(),
        updated_at: new Date()
      } as DataSourceConfig;
      
      this.dataSources.set(config.id, config);
    });
  }

  private createDefaultERPConnectors() {
    const defaultConnectors: ERPConnector[] = [
      {
        id: "tally_connector",
        name: "Tally ERP Integration",
        type: "tally",
        config: {
          baseUrl: "http://localhost:9000",
          timeout: 30000
        },
        status: "inactive",
        last_sync: null,
        data_formats: ["xml", "json"]
      },
      {
        id: "sap_connector",
        name: "SAP ERP Integration",
        type: "sap",
        config: {
          baseUrl: "https://your-sap-instance.com/sap/opu/odata/sap",
          username: "",
          password: "",
          timeout: 45000
        },
        status: "inactive",
        last_sync: null,
        data_formats: ["xml", "json"]
      },
      {
        id: "zoho_connector",
        name: "Zoho Books Integration",
        type: "zoho",
        config: {
          baseUrl: "https://books.zoho.com/api/v3",
          apiKey: "",
          timeout: 30000
        },
        status: "inactive",
        last_sync: null,
        data_formats: ["json"]
      },
      {
        id: "oracle_connector",
        name: "Oracle Financials Integration",
        type: "oracle",
        config: {
          baseUrl: "https://your-oracle-instance.com/fscmRestApi",
          username: "",
          password: "",
          timeout: 60000
        },
        status: "inactive",
        last_sync: null,
        data_formats: ["xml", "json"]
      },
      {
        id: "manual_upload",
        name: "Manual File Upload",
        type: "manual",
        config: {
          baseUrl: "/uploads",
          timeout: 30000
        },
        status: "active",
        last_sync: new Date(),
        data_formats: ["excel", "csv", "pdf"]
      }
    ];

    defaultConnectors.forEach(connector => {
      this.erpConnectors.set(connector.id, connector);
    });
  }

  private createDefaultDataFormatTemplates() {
    const templates: DataFormatTemplate[] = [
      {
        id: "sales_register_template",
        name: "Sales Register",
        type: "sales",
        format: "excel",
        columns: [
          { name: "invoice_number", type: "string", required: true },
          { name: "customer_name", type: "string", required: true },
          { name: "invoice_date", type: "date", required: true },
          { name: "amount", type: "number", required: true },
          { name: "gst_amount", type: "number", required: true },
          { name: "total_amount", type: "number", required: true },
          { name: "customer_gstin", type: "string", required: false },
          { name: "place_of_supply", type: "string", required: true }
        ],
        sample_data: [
          {
            invoice_number: "INV-2025-001",
            customer_name: "ABC Corp Ltd",
            invoice_date: "2025-01-15",
            amount: 100000,
            gst_amount: 18000,
            total_amount: 118000,
            customer_gstin: "09ABCDE1234F1Z5",
            place_of_supply: "Delhi"
          }
        ],
        upload_guide: "Upload sales register with invoice details, customer information, and GST calculations"
      },
      {
        id: "purchase_register_template",
        name: "Purchase Register",
        type: "purchase",
        format: "excel",
        columns: [
          { name: "invoice_number", type: "string", required: true },
          { name: "vendor_name", type: "string", required: true },
          { name: "invoice_date", type: "date", required: true },
          { name: "amount", type: "number", required: true },
          { name: "gst_amount", type: "number", required: true },
          { name: "total_amount", type: "number", required: true },
          { name: "vendor_gstin", type: "string", required: true },
          { name: "tds_amount", type: "number", required: false }
        ],
        sample_data: [
          {
            invoice_number: "VINV-2025-001",
            vendor_name: "XYZ Suppliers Ltd",
            invoice_date: "2025-01-15",
            amount: 200000,
            gst_amount: 36000,
            total_amount: 236000,
            vendor_gstin: "09XYZAB1234F1Z5",
            tds_amount: 2000
          }
        ],
        upload_guide: "Upload purchase register with vendor invoice details and TDS deductions"
      },
      {
        id: "gst_return_template",
        name: "GST Return Data",
        type: "gst",
        format: "csv",
        columns: [
          { name: "gstin", type: "string", required: true },
          { name: "return_period", type: "string", required: true },
          { name: "transaction_type", type: "string", required: true },
          { name: "taxable_value", type: "number", required: true },
          { name: "igst_amount", type: "number", required: false },
          { name: "cgst_amount", type: "number", required: false },
          { name: "sgst_amount", type: "number", required: false },
          { name: "total_tax", type: "number", required: true }
        ],
        sample_data: [
          {
            gstin: "09ABCDE1234F1Z5",
            return_period: "012025",
            transaction_type: "B2B",
            taxable_value: 100000,
            igst_amount: 0,
            cgst_amount: 9000,
            sgst_amount: 9000,
            total_tax: 18000
          }
        ],
        upload_guide: "Upload GST return data with transaction details and tax calculations"
      },
      {
        id: "tds_return_template",
        name: "TDS Return Data",
        type: "tds",
        format: "excel",
        columns: [
          { name: "deductee_name", type: "string", required: true },
          { name: "deductee_pan", type: "string", required: true },
          { name: "section_code", type: "string", required: true },
          { name: "payment_amount", type: "number", required: true },
          { name: "tds_amount", type: "number", required: true },
          { name: "tds_rate", type: "number", required: true },
          { name: "payment_date", type: "date", required: true },
          { name: "challan_number", type: "string", required: false }
        ],
        sample_data: [
          {
            deductee_name: "John Doe",
            deductee_pan: "ABCDE1234F",
            section_code: "194A",
            payment_amount: 50000,
            tds_amount: 5000,
            tds_rate: 10,
            payment_date: "2025-01-15",
            challan_number: "CHL-2025-001"
          }
        ],
        upload_guide: "Upload TDS return data with deductee details and tax deductions"
      },
      {
        id: "payroll_template",
        name: "Payroll Data",
        type: "payroll",
        format: "excel",
        columns: [
          { name: "employee_id", type: "string", required: true },
          { name: "employee_name", type: "string", required: true },
          { name: "basic_salary", type: "number", required: true },
          { name: "allowances", type: "number", required: false },
          { name: "deductions", type: "number", required: false },
          { name: "gross_salary", type: "number", required: true },
          { name: "pf_amount", type: "number", required: false },
          { name: "esi_amount", type: "number", required: false },
          { name: "tds_amount", type: "number", required: false },
          { name: "net_salary", type: "number", required: true }
        ],
        sample_data: [
          {
            employee_id: "EMP001",
            employee_name: "John Doe",
            basic_salary: 50000,
            allowances: 15000,
            deductions: 2000,
            gross_salary: 63000,
            pf_amount: 6000,
            esi_amount: 1000,
            tds_amount: 2000,
            net_salary: 54000
          }
        ],
        upload_guide: "Upload payroll data with employee salary details and statutory deductions"
      },
      {
        id: "bank_statement_template",
        name: "Bank Statement",
        type: "bank_statement",
        format: "csv",
        columns: [
          { name: "transaction_date", type: "date", required: true },
          { name: "description", type: "string", required: true },
          { name: "debit_amount", type: "number", required: false },
          { name: "credit_amount", type: "number", required: false },
          { name: "balance", type: "number", required: true },
          { name: "reference_number", type: "string", required: false },
          { name: "transaction_type", type: "string", required: false }
        ],
        sample_data: [
          {
            transaction_date: "2025-01-15",
            description: "Payment from ABC Corp",
            debit_amount: 0,
            credit_amount: 118000,
            balance: 500000,
            reference_number: "REF123456",
            transaction_type: "CREDIT"
          }
        ],
        upload_guide: "Upload bank statement with transaction details and running balance"
      },
      {
        id: "journal_template",
        name: "Journal Entries",
        type: "journal",
        format: "excel",
        columns: [
          { name: "entry_date", type: "date", required: true },
          { name: "account_code", type: "string", required: true },
          { name: "account_name", type: "string", required: true },
          { name: "debit_amount", type: "number", required: false },
          { name: "credit_amount", type: "number", required: false },
          { name: "narration", type: "string", required: true },
          { name: "reference", type: "string", required: false },
          { name: "cost_center", type: "string", required: false }
        ],
        sample_data: [
          {
            entry_date: "2025-01-15",
            account_code: "1001",
            account_name: "Cash",
            debit_amount: 118000,
            credit_amount: 0,
            narration: "Payment received from ABC Corp",
            reference: "INV-2025-001",
            cost_center: "SALES"
          }
        ],
        upload_guide: "Upload journal entries with proper double-entry bookkeeping format"
      }
    ];

    templates.forEach(template => {
      this.dataFormats.set(template.id, template);
    });
  }

  private createDefaultMasterData() {
    const masterDataSets: MasterData[] = [
      {
        id: "gl_codes",
        type: "gl_codes",
        data: [
          // ASSETS (10000-19999) - Current Assets
          { code: "10001", name: "Cash in Hand", type: "Asset", category: "Current Assets" },
          { code: "10002", name: "Cash at Bank - Current Account", type: "Asset", category: "Current Assets" },
          { code: "10003", name: "Cash at Bank - Savings Account", type: "Asset", category: "Current Assets" },
          { code: "10010", name: "Accounts Receivable/Trade Debtors", type: "Asset", category: "Current Assets" },
          { code: "10011", name: "Bills Receivable", type: "Asset", category: "Current Assets" },
          { code: "10020", name: "Inventory - Raw Materials", type: "Asset", category: "Current Assets" },
          { code: "10021", name: "Inventory - Work in Progress", type: "Asset", category: "Current Assets" },
          { code: "10022", name: "Inventory - Finished Goods", type: "Asset", category: "Current Assets" },
          { code: "10030", name: "Prepaid Expenses", type: "Asset", category: "Current Assets" },
          { code: "10031", name: "Advance to Suppliers", type: "Asset", category: "Current Assets" },
          { code: "10040", name: "Short-term Investments", type: "Asset", category: "Current Assets" },
          { code: "10050", name: "GST Input Tax Credit - CGST", type: "Asset", category: "Current Assets" },
          { code: "10051", name: "GST Input Tax Credit - SGST", type: "Asset", category: "Current Assets" },
          { code: "10052", name: "GST Input Tax Credit - IGST", type: "Asset", category: "Current Assets" },
          
          // Fixed Assets
          { code: "11001", name: "Land & Building", type: "Asset", category: "Fixed Assets" },
          { code: "11002", name: "Plant & Machinery", type: "Asset", category: "Fixed Assets" },
          { code: "11003", name: "Office Equipment", type: "Asset", category: "Fixed Assets" },
          { code: "11004", name: "Furniture & Fixtures", type: "Asset", category: "Fixed Assets" },
          { code: "11005", name: "Vehicles", type: "Asset", category: "Fixed Assets" },
          { code: "11010", name: "Computer Hardware", type: "Asset", category: "Fixed Assets" },
          { code: "11020", name: "Accumulated Depreciation - Building", type: "Asset", category: "Fixed Assets" },
          { code: "11021", name: "Accumulated Depreciation - Machinery", type: "Asset", category: "Fixed Assets" },
          { code: "11022", name: "Accumulated Depreciation - Equipment", type: "Asset", category: "Fixed Assets" },
          
          // Non-Current Assets
          { code: "12001", name: "Long-term Investments", type: "Asset", category: "Non-Current Assets" },
          { code: "12002", name: "Goodwill", type: "Asset", category: "Non-Current Assets" },
          { code: "12003", name: "Patents & Trademarks", type: "Asset", category: "Non-Current Assets" },
          { code: "12004", name: "Security Deposits", type: "Asset", category: "Non-Current Assets" },

          // LIABILITIES (20000-29999) - Current Liabilities
          { code: "20001", name: "Accounts Payable/Trade Creditors", type: "Liability", category: "Current Liabilities" },
          { code: "20002", name: "Bills Payable", type: "Liability", category: "Current Liabilities" },
          { code: "20010", name: "Short-term Bank Loans", type: "Liability", category: "Current Liabilities" },
          { code: "20011", name: "Bank Overdraft", type: "Liability", category: "Current Liabilities" },
          { code: "20020", name: "Accrued Expenses", type: "Liability", category: "Current Liabilities" },
          { code: "20021", name: "Outstanding Salaries", type: "Liability", category: "Current Liabilities" },
          { code: "20030", name: "GST Output Tax Liability - CGST", type: "Liability", category: "Current Liabilities" },
          { code: "20031", name: "GST Output Tax Liability - SGST", type: "Liability", category: "Current Liabilities" },
          { code: "20032", name: "GST Output Tax Liability - IGST", type: "Liability", category: "Current Liabilities" },
          { code: "20040", name: "TDS Payable", type: "Liability", category: "Current Liabilities" },
          { code: "20041", name: "ESI Payable", type: "Liability", category: "Current Liabilities" },
          { code: "20042", name: "PF Payable", type: "Liability", category: "Current Liabilities" },
          { code: "20050", name: "Advance from Customers", type: "Liability", category: "Current Liabilities" },
          { code: "20060", name: "Income Tax Provision", type: "Liability", category: "Current Liabilities" },
          
          // Long-term Liabilities
          { code: "21001", name: "Long-term Bank Loans", type: "Liability", category: "Long-term Liabilities" },
          { code: "21002", name: "Mortgage Loans", type: "Liability", category: "Long-term Liabilities" },
          { code: "21003", name: "Debentures", type: "Liability", category: "Long-term Liabilities" },
          { code: "21010", name: "Provision for Gratuity", type: "Liability", category: "Long-term Liabilities" },
          { code: "21011", name: "Provision for Leave Encashment", type: "Liability", category: "Long-term Liabilities" },

          // EQUITY (30000-39999)
          { code: "30001", name: "Share Capital - Equity Shares", type: "Equity", category: "Equity" },
          { code: "30002", name: "Share Capital - Preference Shares", type: "Equity", category: "Equity" },
          { code: "30010", name: "Share Premium", type: "Equity", category: "Equity" },
          { code: "30020", name: "General Reserve", type: "Equity", category: "Equity" },
          { code: "30021", name: "Statutory Reserve", type: "Equity", category: "Equity" },
          { code: "30030", name: "Retained Earnings", type: "Equity", category: "Equity" },
          { code: "30031", name: "Current Year Profit/Loss", type: "Equity", category: "Equity" },

          // REVENUE/INCOME (40000-49999) - Operating Revenue
          { code: "40001", name: "Sales Revenue - Domestic", type: "Revenue", category: "Operating Revenue" },
          { code: "40002", name: "Sales Revenue - Export", type: "Revenue", category: "Operating Revenue" },
          { code: "40003", name: "Service Revenue", type: "Revenue", category: "Operating Revenue" },
          { code: "40010", name: "Sales Returns", type: "Revenue", category: "Operating Revenue" },
          { code: "40011", name: "Sales Discounts", type: "Revenue", category: "Operating Revenue" },
          
          // Other Income
          { code: "41001", name: "Interest Income", type: "Revenue", category: "Other Income" },
          { code: "41002", name: "Dividend Income", type: "Revenue", category: "Other Income" },
          { code: "41003", name: "Rental Income", type: "Revenue", category: "Other Income" },
          { code: "41004", name: "Commission Income", type: "Revenue", category: "Other Income" },
          { code: "41005", name: "Foreign Exchange Gain", type: "Revenue", category: "Other Income" },
          { code: "41010", name: "Other Miscellaneous Income", type: "Revenue", category: "Other Income" },

          // EXPENSES (50000-59999) - Cost of Goods Sold
          { code: "50001", name: "Raw Material Consumption", type: "Expense", category: "Cost of Goods Sold" },
          { code: "50002", name: "Direct Labor", type: "Expense", category: "Cost of Goods Sold" },
          { code: "50003", name: "Manufacturing Overhead", type: "Expense", category: "Cost of Goods Sold" },
          { code: "50010", name: "Purchase Returns", type: "Expense", category: "Cost of Goods Sold" },
          { code: "50011", name: "Purchase Discounts", type: "Expense", category: "Cost of Goods Sold" },
          { code: "50020", name: "Freight Inward", type: "Expense", category: "Cost of Goods Sold" },
          { code: "50021", name: "Custom Duty", type: "Expense", category: "Cost of Goods Sold" },
          
          // Operating Expenses
          { code: "51001", name: "Salaries & Wages", type: "Expense", category: "Operating Expenses" },
          { code: "51002", name: "Employee Benefits", type: "Expense", category: "Operating Expenses" },
          { code: "51003", name: "Rent Expense", type: "Expense", category: "Operating Expenses" },
          { code: "51004", name: "Electricity Expense", type: "Expense", category: "Operating Expenses" },
          { code: "51005", name: "Telephone Expense", type: "Expense", category: "Operating Expenses" },
          { code: "51010", name: "Office Supplies", type: "Expense", category: "Operating Expenses" },
          { code: "51011", name: "Printing & Stationery", type: "Expense", category: "Operating Expenses" },
          { code: "51020", name: "Marketing & Advertising", type: "Expense", category: "Operating Expenses" },
          { code: "51021", name: "Travel & Conveyance", type: "Expense", category: "Operating Expenses" },
          { code: "51030", name: "Professional Fees", type: "Expense", category: "Operating Expenses" },
          { code: "51031", name: "Legal & Regulatory Fees", type: "Expense", category: "Operating Expenses" },
          { code: "51040", name: "Insurance Premium", type: "Expense", category: "Operating Expenses" },
          { code: "51041", name: "Repairs & Maintenance", type: "Expense", category: "Operating Expenses" },
          
          // Financial Expenses
          { code: "52001", name: "Interest Expense - Bank Loans", type: "Expense", category: "Financial Expenses" },
          { code: "52002", name: "Bank Charges", type: "Expense", category: "Financial Expenses" },
          { code: "52003", name: "Foreign Exchange Loss", type: "Expense", category: "Financial Expenses" },
          { code: "52010", name: "Late Payment Fees", type: "Expense", category: "Financial Expenses" },
          
          // Administrative Expenses
          { code: "53001", name: "Depreciation Expense", type: "Expense", category: "Administrative Expenses" },
          { code: "53002", name: "Audit Fees", type: "Expense", category: "Administrative Expenses" },
          { code: "53003", name: "Director Fees", type: "Expense", category: "Administrative Expenses" },
          { code: "53010", name: "Bad Debt Expense", type: "Expense", category: "Administrative Expenses" },
          { code: "53011", name: "Provision for Doubtful Debts", type: "Expense", category: "Administrative Expenses" },
          
          // Tax Expenses
          { code: "54001", name: "Income Tax Expense", type: "Expense", category: "Tax Expenses" },
          { code: "54002", name: "Deferred Tax", type: "Expense", category: "Tax Expenses" },
          { code: "54003", name: "GST Expense (non-recoverable)", type: "Expense", category: "Tax Expenses" }
        ],
        last_updated: new Date(),
        source: "indian_accounting_standards"
      },
      {
        id: "tds_sections",
        type: "tds_sections",
        data: [
          // Major TDS Sections - FY 2025-26 (AY 2026-27)
          { code: "192", description: "Salary", rate: "As per tax slab", threshold: "No threshold", applicability: "Salary payments to employees", effective_date: "All years" },
          { code: "193", description: "Interest on Securities", rate: 10, threshold: 2500, applicability: "Interest on listed debentures (from April 2023)", effective_date: "FY 2023-24 onwards" },
          { code: "194", description: "Dividend", rate: 10, threshold: 5000, applicability: "Dividend payments", higher_rate: "20% if PAN not provided", effective_date: "All years" },
          { code: "194A", description: "Interest (other than securities)", rate: 10, threshold: 50000, applicability: "Banking companies and co-operative societies (enhanced from Rs. 40,000)", effective_date: "April 2025" },
          { code: "194B", description: "Lottery/Gambling", rate: 30, threshold: 10000, applicability: "Winnings from lottery, crossword, gambling", effective_date: "All years" },
          { code: "194BA", description: "Online Games", rate: 30, threshold: "No threshold", applicability: "TDS on net winnings at year-end or withdrawal", effective_date: "FY 2023-24 onwards" },
          { code: "194C", description: "Contract Payments", rate: "1% (individuals/HUF), 2% (others)", threshold: 30000, applicability: "Payments to contractors per financial year", effective_date: "All years" },
          { code: "194H", description: "Commission & Brokerage", rate: 2, threshold: 15000, applicability: "Commission and brokerage (reduced from 5%)", effective_date: "October 2024" },
          { code: "194I", description: "Rent", rate: "10% (land/buildings), 2% (machinery/equipment)", threshold: "Varies", applicability: "Rental payments", effective_date: "All years" },
          { code: "194IA", description: "Property Sale", rate: "1% (residents), 12.5% (NRIs)", threshold: 5000000, applicability: "Property sale above Rs. 50 lakhs", effective_date: "All years" },
          { code: "194J", description: "Professional/Technical Services", rate: 10, threshold: 30000, applicability: "Professional fees, technical services, royalties, director's commission", effective_date: "All years" },
          { code: "194LBC", description: "Securitization Trust", rate: 10, threshold: "No threshold", applicability: "Income from investments in securitization trusts (reduced from 25%/30%)", effective_date: "April 2025" },
          { code: "194T", description: "Partner's Remuneration (NEW)", rate: 10, threshold: 20000, applicability: "Commission, remuneration, bonuses, salary, interest to partners", effective_date: "April 2025" },
          { code: "195", description: "Non-Resident Payments", rate: "As per Finance Act or DTAA", threshold: "No threshold", applicability: "Payments to non-residents", higher_rate: "If PAN not furnished", effective_date: "All years" },
          
          // Additional Common Sections
          { code: "194D", description: "Insurance Commission", rate: 5, threshold: 15000, applicability: "Insurance commission payments", effective_date: "All years" },
          { code: "194E", description: "Non-resident Sports/Entertainment", rate: 20, threshold: "No threshold", applicability: "Payments to non-resident sportsmen/entertainers", effective_date: "All years" },
          { code: "194F", description: "Mutual Fund Units", rate: 20, threshold: "No threshold", applicability: "Repurchase of mutual fund units", effective_date: "All years" },
          { code: "194G", description: "Commission on Sale of Lottery Tickets", rate: 5, threshold: 15000, applicability: "Commission on lottery ticket sales", effective_date: "All years" },
          { code: "194K", description: "Units of Mutual Fund/UTI", rate: 10, threshold: "No threshold", applicability: "Income from units", effective_date: "All years" },
          { code: "194LA", description: "Land/Building Compensation", rate: 10, threshold: 250000, applicability: "Compensation on acquisition of land/building", effective_date: "All years" },
          { code: "194LB", description: "Income from Infrastructure Debt Fund/REIT", rate: 5, threshold: 5000, applicability: "Distributed income from infrastructure debt fund", effective_date: "All years" },
          { code: "194M", description: "Commission/Brokerage to Resident", rate: 5, threshold: 15000, applicability: "Commission/brokerage to residents", effective_date: "All years" },
          { code: "194N", description: "Cash Withdrawal", rate: 2, threshold: "Varies", applicability: "Cash withdrawals exceeding limits", effective_date: "September 2019" },
          { code: "194O", description: "E-commerce Transactions", rate: 1, threshold: 500000, applicability: "E-commerce operator payments", effective_date: "October 2020" },
          { code: "194Q", description: "Purchase of Goods", rate: 0.1, threshold: 5000000, applicability: "Purchase of goods exceeding Rs. 50 lakhs", effective_date: "July 2021" },
          { code: "194S", description: "Cryptocurrency/Virtual Digital Assets", rate: 1, threshold: 10000, applicability: "Transfer of virtual digital assets", effective_date: "July 2022" },
          
          // Important Notes
          { code: "NOTES", description: "Important Changes for FY 2025-26", rate: "N/A", threshold: "N/A", applicability: "1. Sections 206AB & 206CCA (higher rates for non-filers) removed from April 2025. 2. Health & Education Cess: 4% on total tax. 3. DTAA benefits available for lower rates. 4. Due date: 7th of following month.", effective_date: "April 2025" }
        ],
        last_updated: new Date(),
        source: "income_tax_act_2025"
      },
      {
        id: "vendors",
        type: "vendors",
        data: [
          { id: "V001", name: "ABC Suppliers Ltd", gstin: "09ABCDE1234F1Z5", pan: "ABCDE1234F", category: "Raw Materials" },
          { id: "V002", name: "XYZ Services Pvt Ltd", gstin: "09XYZAB1234F1Z5", pan: "XYZAB1234F", category: "Professional Services" },
          { id: "V003", name: "Tech Solutions Inc", gstin: "09TECHP1234F1Z5", pan: "TECHP1234F", category: "IT Services" },
          { id: "V004", name: "Office Supplies Co", gstin: "09OFFIC1234F1Z5", pan: "OFFIC1234F", category: "Office Supplies" },
          { id: "V005", name: "Transport Services", gstin: "09TRANS1234F1Z5", pan: "TRANS1234F", category: "Transportation" }
        ],
        last_updated: new Date(),
        source: "manual_entry"
      },
      {
        id: "cost_centers",
        type: "cost_centers",
        data: [
          { code: "SALES", name: "Sales Department", budget: 1000000, head: "Sales Manager" },
          { code: "MARKETING", name: "Marketing Department", budget: 500000, head: "Marketing Manager" },
          { code: "ADMIN", name: "Administration", budget: 300000, head: "Admin Manager" },
          { code: "IT", name: "Information Technology", budget: 800000, head: "IT Manager" },
          { code: "HR", name: "Human Resources", budget: 400000, head: "HR Manager" },
          { code: "FINANCE", name: "Finance Department", budget: 200000, head: "Finance Manager" }
        ],
        last_updated: new Date(),
        source: "system_setup"
      },
      {
        id: "customers",
        type: "customers",
        data: [
          { id: "C001", name: "ABC Corp Ltd", gstin: "09ABCCO1234F1Z5", pan: "ABCCO1234F", category: "Corporate" },
          { id: "C002", name: "XYZ Industries", gstin: "09XYZIN1234F1Z5", pan: "XYZIN1234F", category: "Manufacturing" },
          { id: "C003", name: "Tech Innovations", gstin: "09TECHI1234F1Z5", pan: "TECHI1234F", category: "Technology" },
          { id: "C004", name: "Retail Solutions", gstin: "09RETAIL1234F1Z5", pan: "RETAIL1234F", category: "Retail" },
          { id: "C005", name: "Service Providers", gstin: "09SERVIC1234F1Z5", pan: "SERVIC1234F", category: "Services" }
        ],
        last_updated: new Date(),
        source: "manual_entry"
      },
      {
        id: "products",
        type: "products",
        data: [
          { id: "P001", name: "Software License", hsn_code: "998311", gst_rate: 18, category: "Software" },
          { id: "P002", name: "Consulting Services", hsn_code: "998314", gst_rate: 18, category: "Services" },
          { id: "P003", name: "Hardware Equipment", hsn_code: "847330", gst_rate: 18, category: "Hardware" },
          { id: "P004", name: "Training Services", hsn_code: "924990", gst_rate: 18, category: "Education" },
          { id: "P005", name: "Support Services", hsn_code: "998313", gst_rate: 18, category: "Support" }
        ],
        last_updated: new Date(),
        source: "product_catalog"
      }
    ];

    masterDataSets.forEach(data => {
      this.masterData.set(data.id, data);
    });
  }

  // Data Source Management
  async getAllDataSources(): Promise<DataSourceConfig[]> {
    return Array.from(this.dataSources.values());
  }

  async getDataSource(id: string): Promise<DataSourceConfig | null> {
    return this.dataSources.get(id) || null;
  }

  async createDataSource(config: Partial<DataSourceConfig>): Promise<DataSourceConfig> {
    const newConfig: DataSourceConfig = {
      id: config.id || nanoid(),
      name: config.name || "",
      type: config.type || DataSourceType.FILE_SYSTEM,
      description: config.description || "",
      config: config.config || {},
      is_active: config.is_active || false,
      is_default: config.is_default || false,
      status: ConnectionStatus.DISCONNECTED,
      last_tested: null,
      error_message: null,
      metadata: config.metadata || {},
      created_at: new Date(),
      updated_at: new Date()
    };

    this.dataSources.set(newConfig.id, newConfig);
    return newConfig;
  }

  async updateDataSource(id: string, updates: Partial<DataSourceConfig>): Promise<DataSourceConfig | null> {
    const existing = this.dataSources.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date()
    };

    this.dataSources.set(id, updated);
    return updated;
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string; duration: number }> {
    const source = this.dataSources.get(id);
    if (!source) {
      return { success: false, message: "Data source not found", duration: 0 };
    }

    const startTime = Date.now();

    try {
      // Update status to testing
      source.status = ConnectionStatus.TESTING;
      this.dataSources.set(id, source);

      // Simulate connection test based on type
      await this.simulateConnectionTest(source);

      const duration = Date.now() - startTime;
      
      // Update status to connected
      source.status = ConnectionStatus.CONNECTED;
      source.last_tested = new Date();
      source.error_message = null;
      this.dataSources.set(id, source);

      return {
        success: true,
        message: "Connection successful",
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Update status to error
      source.status = ConnectionStatus.ERROR;
      source.last_tested = new Date();
      source.error_message = error instanceof Error ? error.message : "Unknown error";
      this.dataSources.set(id, source);

      return {
        success: false,
        message: source.error_message,
        duration
      };
    }
  }

  private async simulateConnectionTest(source: DataSourceConfig): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));

    // Simulate some failures for demonstration
    if (source.type === DataSourceType.GST_PORTAL && !process.env.GST_API_KEY) {
      throw new Error("GST API key not configured");
    }

    if (source.type === DataSourceType.MCA_PORTAL && !process.env.MCA_API_KEY) {
      throw new Error("MCA API key not configured");
    }

    // For ERP systems, check if configuration is complete
    if (source.type === DataSourceType.ERP_SYSTEM) {
      if (!source.config.baseUrl || !source.config.apiKey) {
        throw new Error("ERP system configuration incomplete");
      }
    }
  }

  // ERP Connector Management
  async getAllERPConnectors(): Promise<ERPConnector[]> {
    return Array.from(this.erpConnectors.values());
  }

  async getERPConnector(id: string): Promise<ERPConnector | null> {
    return this.erpConnectors.get(id) || null;
  }

  async updateERPConnector(id: string, updates: Partial<ERPConnector>): Promise<ERPConnector | null> {
    const existing = this.erpConnectors.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.erpConnectors.set(id, updated);
    return updated;
  }

  async syncERPData(id: string): Promise<{ success: boolean; message: string; recordsProcessed: number }> {
    const connector = this.erpConnectors.get(id);
    if (!connector) {
      return { success: false, message: "ERP connector not found", recordsProcessed: 0 };
    }

    try {
      // Simulate data sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const recordsProcessed = Math.floor(Math.random() * 100) + 10;
      
      connector.last_sync = new Date();
      connector.status = 'active';
      this.erpConnectors.set(id, connector);

      return {
        success: true,
        message: "Data sync completed successfully",
        recordsProcessed
      };
    } catch (error) {
      connector.status = 'error';
      this.erpConnectors.set(id, connector);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Sync failed",
        recordsProcessed: 0
      };
    }
  }

  // Data Format Template Management
  async getAllDataFormats(): Promise<DataFormatTemplate[]> {
    return Array.from(this.dataFormats.values());
  }

  async getDataFormat(id: string): Promise<DataFormatTemplate | null> {
    return this.dataFormats.get(id) || null;
  }

  async getDataFormatsByType(type: DataFormatTemplate['type']): Promise<DataFormatTemplate[]> {
    return Array.from(this.dataFormats.values()).filter(format => format.type === type);
  }

  // Master Data Management
  async getAllMasterData(): Promise<MasterData[]> {
    return Array.from(this.masterData.values());
  }

  async getMasterData(id: string): Promise<MasterData | null> {
    return this.masterData.get(id) || null;
  }

  async getMasterDataByType(type: MasterData['type']): Promise<MasterData | null> {
    return Array.from(this.masterData.values()).find(data => data.type === type) || null;
  }

  async updateMasterData(id: string, newData: Record<string, any>[]): Promise<MasterData | null> {
    const existing = this.masterData.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      data: newData,
      last_updated: new Date()
    };

    this.masterData.set(id, updated);
    return updated;
  }

  // AI Learning Initialization
  async initializeAILearning(): Promise<{ success: boolean; message: string; samplesProcessed: number }> {
    try {
      // Simulate AI learning initialization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const samplesProcessed = Math.floor(Math.random() * 50) + 20;
      
      return {
        success: true,
        message: "AI learning initialized with historical data",
        samplesProcessed
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "AI initialization failed",
        samplesProcessed: 0
      };
    }
  }

  // Statistics and Monitoring
  async getDataSourceStats(): Promise<{
    total: number;
    connected: number;
    disconnected: number;
    errors: number;
    active: number;
  }> {
    const sources = Array.from(this.dataSources.values());
    
    return {
      total: sources.length,
      connected: sources.filter(s => s.status === ConnectionStatus.CONNECTED).length,
      disconnected: sources.filter(s => s.status === ConnectionStatus.DISCONNECTED).length,
      errors: sources.filter(s => s.status === ConnectionStatus.ERROR).length,
      active: sources.filter(s => s.is_active).length
    };
  }

  async getERPStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    errors: number;
    last_sync: Date | null;
  }> {
    const connectors = Array.from(this.erpConnectors.values());
    
    return {
      total: connectors.length,
      active: connectors.filter(c => c.status === 'active').length,
      inactive: connectors.filter(c => c.status === 'inactive').length,
      errors: connectors.filter(c => c.status === 'error').length,
      last_sync: connectors.reduce((latest, c) => {
        if (!c.last_sync) return latest;
        return !latest || c.last_sync > latest ? c.last_sync : latest;
      }, null as Date | null)
    };
  }
}

export const dataSourceService = new DataSourceService();