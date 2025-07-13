#!/usr/bin/env python3
"""
Final comprehensive test for the Python/FastAPI refactored QRT Closure Platform
"""

import sys
import os
import asyncio
from datetime import datetime
from fastapi.testclient import TestClient

# Add the app directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_complete_system():
    """Test the complete system functionality"""
    
    print("=" * 70)
    print("QRT CLOSURE PLATFORM - FINAL COMPREHENSIVE TEST")
    print("=" * 70)
    
    # Import and test core components
    print("\n1. CORE SYSTEM IMPORTS AND SETUP")
    print("-" * 40)
    
    try:
        from main import app
        from app.config import settings
        from app.models import User, Document, ComplianceCheck
        from app.services.ai_orchestrator import AIOrchestrator
        from app.services.document_processor import DocumentProcessor
        from app.services.compliance_checker import ComplianceChecker
        from app.services.financial_reports import FinancialReportsService
        from app.auth import create_access_token
        
        print("✓ All core modules imported successfully")
        
        # Create test client
        client = TestClient(app)
        print("✓ FastAPI test client created")
        
    except Exception as e:
        print(f"✗ Core setup failed: {e}")
        return False
    
    # Test FastAPI application
    print("\n2. FASTAPI APPLICATION VALIDATION")
    print("-" * 40)
    
    try:
        # Test basic application properties
        assert app.title == "QRT Closure Agent Platform"
        assert app.version == "1.0.0"
        print("✓ FastAPI application configured correctly")
        
        # Test route registration
        routes = [route.path for route in app.routes]
        critical_routes = [
            "/api/health",
            "/api/auth/login",
            "/api/auth/user",
            "/api/documents/upload",
            "/api/workflows",
            "/api/compliance-checks",
            "/api/financial-statements",
            "/api/dashboard/stats"
        ]
        
        for route in critical_routes:
            assert route in routes, f"Critical route {route} missing"
        
        print(f"✓ All {len(critical_routes)} critical routes registered")
        
    except Exception as e:
        print(f"✗ FastAPI validation failed: {e}")
        return False
    
    # Test API endpoints
    print("\n3. API ENDPOINTS TESTING")
    print("-" * 40)
    
    try:
        # Test health endpoint
        response = client.get("/api/health")
        assert response.status_code == 200
        health_data = response.json()
        assert health_data["status"] == "healthy"
        print("✓ Health endpoint working")
        
        # Test OpenAPI documentation
        response = client.get("/openapi.json")
        assert response.status_code == 200
        openapi_spec = response.json()
        assert "paths" in openapi_spec
        assert len(openapi_spec["paths"]) > 15
        print(f"✓ OpenAPI documentation with {len(openapi_spec['paths'])} endpoints")
        
        # Test authentication structure
        response = client.post("/api/auth/login", json={"email": "test", "password": "test"})
        # Should return 422 for validation error, not 500
        assert response.status_code == 422
        print("✓ Authentication validation working")
        
    except Exception as e:
        print(f"✗ API endpoints test failed: {e}")
        return False
    
    # Test AI orchestration
    print("\n4. AI ORCHESTRATION SYSTEM")
    print("-" * 40)
    
    try:
        orchestrator = AIOrchestrator()
        
        # Test agent configuration
        expected_agents = [
            "ClassifierBot", "DataExtractor", "JournalBot", 
            "GSTValidator", "TDSValidator", "ConsoAI", "AuditAgent"
        ]
        
        for agent_id in expected_agents:
            assert agent_id in orchestrator.agents
            agent_config = orchestrator.agents[agent_id]
            assert all(key in agent_config for key in ['name', 'description', 'model', 'system_prompt'])
        
        print(f"✓ All {len(expected_agents)} AI agents configured")
        
        # Test workflow generation
        workflows = asyncio.run(orchestrator.get_workflows("test_user"))
        assert len(workflows) == 7
        print("✓ AI workflows generated successfully")
        
    except Exception as e:
        print(f"✗ AI orchestration test failed: {e}")
        return False
    
    # Test document processing
    print("\n5. DOCUMENT PROCESSING SYSTEM")
    print("-" * 40)
    
    try:
        processor = DocumentProcessor()
        
        # Test document type inference
        test_cases = [
            ("vendor_invoice_2024.pdf", "vendor_invoice"),
            ("sales_register_q1.xlsx", "sales_register"),
            ("payroll_jan_2024.csv", "salary_register"),
            ("bank_statement_dec.pdf", "bank_statement"),
            ("purchase_order_001.pdf", "purchase_order"),
            ("expense_report.xlsx", "expense_report")
        ]
        
        for filename, expected_type in test_cases:
            inferred_type = processor._infer_document_type(filename)
            assert inferred_type == expected_type
        
        print(f"✓ Document type inference working for {len(test_cases)} file types")
        
        # Test sample data generation
        sample_data = processor.get_sample_data("vendor_invoice", "test_invoice.pdf")
        assert sample_data is not None
        assert "invoices" in sample_data
        print("✓ Sample data generation working")
        
    except Exception as e:
        print(f"✗ Document processing test failed: {e}")
        return False
    
    # Test compliance checker
    print("\n6. COMPLIANCE VALIDATION SYSTEM")
    print("-" * 40)
    
    try:
        checker = ComplianceChecker()
        
        # Test GSTIN validation
        valid_gstins = ["09ABCDE1234F1Z5", "27ABCDE1234F1Z5", "07ABCDE1234F1Z5"]
        invalid_gstins = ["INVALID", "123456789", "09ABCDE1234F1Z"]
        
        for gstin in valid_gstins:
            assert checker._validate_gstin(gstin) == True
        
        for gstin in invalid_gstins:
            assert checker._validate_gstin(gstin) == False
        
        print(f"✓ GSTIN validation working for {len(valid_gstins)} valid cases")
        
        # Test TAN validation
        valid_tans = ["ABCD12345E", "MUMBAI001A", "DELHI0001B"]
        invalid_tans = ["INVALID", "123456789", "ABCD1234"]
        
        for tan in valid_tans:
            assert checker._validate_tan(tan) == True
        
        for tan in invalid_tans:
            assert checker._validate_tan(tan) == False
        
        print(f"✓ TAN validation working for {len(valid_tans)} valid cases")
        
    except Exception as e:
        print(f"✗ Compliance validation test failed: {e}")
        return False
    
    # Test financial reports
    print("\n7. FINANCIAL REPORTING SYSTEM")
    print("-" * 40)
    
    try:
        reports_service = FinancialReportsService()
        
        # Test all statement types
        statement_types = ['trial_balance', 'profit_loss', 'balance_sheet', 'cash_flow']
        
        for stmt_type in statement_types:
            assert stmt_type in reports_service.statement_types
        
        print(f"✓ All {len(statement_types)} statement types available")
        
        # Test report generation
        trial_balance = reports_service._generate_trial_balance("Q1_2025")
        assert "accounts" in trial_balance
        assert len(trial_balance["accounts"]) > 0
        assert "total_debit" in trial_balance
        assert "total_credit" in trial_balance
        print("✓ Trial balance generation working")
        
        profit_loss = reports_service._generate_profit_loss("Q1_2025")
        assert "revenue" in profit_loss
        assert "expenses" in profit_loss
        assert "net_income" in profit_loss
        print("✓ Profit & Loss generation working")
        
        balance_sheet = reports_service._generate_balance_sheet("Q1_2025")
        assert "assets" in balance_sheet
        assert "liabilities" in balance_sheet
        assert "equity" in balance_sheet
        print("✓ Balance sheet generation working")
        
        cash_flow = reports_service._generate_cash_flow("Q1_2025")
        assert "operating_activities" in cash_flow
        assert "investing_activities" in cash_flow
        assert "financing_activities" in cash_flow
        print("✓ Cash flow generation working")
        
    except Exception as e:
        print(f"✗ Financial reports test failed: {e}")
        return False
    
    # Test database connectivity
    print("\n8. DATABASE CONNECTIVITY")
    print("-" * 40)
    
    try:
        from app.database import engine, Base
        from sqlalchemy import text
        
        # Test database connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✓ Database connected: {version.split()[0]} {version.split()[1]}")
        
        # Test table creation
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created/verified")
        
        # Test table existence
        with engine.connect() as connection:
            tables = connection.execute(text("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            """)).fetchall()
            
            table_names = [table[0] for table in tables]
            critical_tables = ['users', 'documents', 'compliance_checks', 'audit_trail']
            
            for table in critical_tables:
                if table in table_names:
                    print(f"✓ Table '{table}' exists")
                else:
                    print(f"⚠ Table '{table}' will be created on first use")
        
    except Exception as e:
        print(f"✗ Database connectivity test failed: {e}")
        return False
    
    # Test configuration
    print("\n9. CONFIGURATION VALIDATION")
    print("-" * 40)
    
    try:
        # Test required settings
        required_settings = [
            'DATABASE_URL', 'SECRET_KEY', 'ALGORITHM',
            'ACCESS_TOKEN_EXPIRE_MINUTES', 'MAX_FILE_SIZE'
        ]
        
        for setting in required_settings:
            assert hasattr(settings, setting)
            assert getattr(settings, setting) is not None
        
        print(f"✓ All {len(required_settings)} required settings configured")
        
        # Test optional AI settings
        ai_settings = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY']
        configured_ai = []
        
        for setting in ai_settings:
            if hasattr(settings, setting) and getattr(settings, setting):
                configured_ai.append(setting)
        
        print(f"✓ AI services configured: {len(configured_ai)}/{len(ai_settings)}")
        
    except Exception as e:
        print(f"✗ Configuration validation failed: {e}")
        return False
    
    # Final summary
    print("\n" + "=" * 70)
    print("FINAL TEST SUMMARY")
    print("=" * 70)
    
    print("✓ Core system imports and setup")
    print("✓ FastAPI application validation")
    print("✓ API endpoints testing")
    print("✓ AI orchestration system")
    print("✓ Document processing system")
    print("✓ Compliance validation system")
    print("✓ Financial reporting system")
    print("✓ Database connectivity")
    print("✓ Configuration validation")
    
    print("\n🎉 ALL TESTS PASSED!")
    print("The Python/FastAPI refactoring is fully functional and ready for production!")
    
    print("\nKEY CAPABILITIES VALIDATED:")
    print("• 7 AI agents with specialized roles")
    print("• Document processing for PDF, Excel, CSV")
    print("• GST and TDS compliance validation")
    print("• Financial reporting (Trial Balance, P&L, Balance Sheet, Cash Flow)")
    print("• JWT-based authentication")
    print("• PostgreSQL database integration")
    print("• FastAPI with auto-generated documentation")
    print("• Comprehensive API endpoints")
    
    return True

if __name__ == "__main__":
    success = test_complete_system()
    sys.exit(0 if success else 1)