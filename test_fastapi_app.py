#!/usr/bin/env python3
"""
Comprehensive test suite for the refactored Python/FastAPI QRT Closure platform
"""

import sys
import os
import asyncio
import json
from datetime import datetime
from typing import Dict, Any

# Add the app directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all modules can be imported successfully"""
    print("Testing module imports...")
    
    try:
        from main import app
        print("✓ Main FastAPI app imported successfully")
    except Exception as e:
        print(f"✗ Failed to import main app: {e}")
        return False
    
    try:
        from app.config import settings
        print("✓ Configuration settings imported successfully")
    except Exception as e:
        print(f"✗ Failed to import settings: {e}")
        return False
    
    try:
        from app.models import User, Document, ComplianceCheck, AuditTrail
        print("✓ Database models imported successfully")
    except Exception as e:
        print(f"✗ Failed to import models: {e}")
        return False
    
    try:
        from app.schemas import UserResponse, DocumentResponse, DashboardStats
        print("✓ Pydantic schemas imported successfully")
    except Exception as e:
        print(f"✗ Failed to import schemas: {e}")
        return False
    
    try:
        from app.auth import create_access_token, verify_token
        print("✓ Authentication module imported successfully")
    except Exception as e:
        print(f"✗ Failed to import auth: {e}")
        return False
    
    try:
        from app.services.document_processor import DocumentProcessor
        from app.services.ai_orchestrator import AIOrchestrator
        from app.services.compliance_checker import ComplianceChecker
        from app.services.financial_reports import FinancialReportsService
        print("✓ All service modules imported successfully")
    except Exception as e:
        print(f"✗ Failed to import services: {e}")
        return False
    
    return True

def test_configuration():
    """Test configuration settings"""
    print("\nTesting configuration...")
    
    try:
        from app.config import settings
        
        # Test required settings
        required_settings = [
            'DATABASE_URL', 'SECRET_KEY', 'ALGORITHM', 
            'ACCESS_TOKEN_EXPIRE_MINUTES', 'MAX_FILE_SIZE'
        ]
        
        for setting in required_settings:
            if hasattr(settings, setting):
                print(f"✓ {setting} is configured")
            else:
                print(f"✗ {setting} is missing")
                return False
        
        # Test optional AI settings
        if settings.ANTHROPIC_API_KEY:
            print("✓ ANTHROPIC_API_KEY is configured")
        else:
            print("⚠ ANTHROPIC_API_KEY not configured (optional)")
        
        if settings.OPENAI_API_KEY:
            print("✓ OPENAI_API_KEY is configured")
        else:
            print("⚠ OPENAI_API_KEY not configured (optional)")
        
        return True
        
    except Exception as e:
        print(f"✗ Configuration test failed: {e}")
        return False

def test_authentication():
    """Test authentication functionality"""
    print("\nTesting authentication...")
    
    try:
        from app.auth import create_access_token, verify_token
        
        # Test token creation
        test_data = {"sub": "test@example.com", "user_id": "123"}
        token = create_access_token(test_data)
        
        if token:
            print("✓ JWT token creation successful")
        else:
            print("✗ JWT token creation failed")
            return False
        
        # Test token verification
        payload = verify_token(token)
        
        if payload and payload.get("sub") == "test@example.com":
            print("✓ JWT token verification successful")
        else:
            print("✗ JWT token verification failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Authentication test failed: {e}")
        return False

def test_database_models():
    """Test database model definitions"""
    print("\nTesting database models...")
    
    try:
        from app.models import User, Document, ComplianceCheck, AuditTrail
        from app.database import Base
        
        # Test model attributes
        models_to_test = [
            (User, ['id', 'email', 'first_name', 'last_name']),
            (Document, ['id', 'filename', 'file_type', 'uploaded_by']),
            (ComplianceCheck, ['id', 'document_id', 'check_type', 'result']),
            (AuditTrail, ['id', 'user_id', 'action', 'entity_type'])
        ]
        
        for model_class, required_attrs in models_to_test:
            for attr in required_attrs:
                if hasattr(model_class, attr):
                    print(f"✓ {model_class.__name__}.{attr} exists")
                else:
                    print(f"✗ {model_class.__name__}.{attr} missing")
                    return False
        
        print("✓ All database models are properly defined")
        return True
        
    except Exception as e:
        print(f"✗ Database models test failed: {e}")
        return False

def test_pydantic_schemas():
    """Test Pydantic schema validation"""
    print("\nTesting Pydantic schemas...")
    
    try:
        from app.schemas import UserResponse, DocumentResponse, DashboardStats
        
        # Test UserResponse schema
        user_data = {
            "id": "123",
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        user_response = UserResponse(**user_data)
        if user_response.email == "test@example.com":
            print("✓ UserResponse schema validation successful")
        else:
            print("✗ UserResponse schema validation failed")
            return False
        
        # Test DashboardStats schema
        stats_data = {
            "documentsProcessed": 10,
            "activeAgents": 3,
            "validationErrors": 0,
            "complianceScore": 95.5,
            "onboardingComplete": True,
            "currentQuarter": "Q1_2025",
            "nextDueDate": "2025-02-15"
        }
        
        dashboard_stats = DashboardStats(**stats_data)
        if dashboard_stats.documentsProcessed == 10:
            print("✓ DashboardStats schema validation successful")
        else:
            print("✗ DashboardStats schema validation failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Pydantic schemas test failed: {e}")
        return False

async def test_document_processor():
    """Test document processing service"""
    print("\nTesting document processor...")
    
    try:
        from app.services.document_processor import DocumentProcessor
        
        processor = DocumentProcessor()
        
        # Test document type inference
        test_files = [
            ("vendor_invoice_001.pdf", "vendor_invoice"),
            ("sales_register_Q1.xlsx", "sales_register"),
            ("salary_payroll_jan.csv", "salary_register"),
            ("bank_statement_dec.pdf", "bank_statement")
        ]
        
        for filename, expected_type in test_files:
            inferred_type = processor._infer_document_type(filename)
            if inferred_type == expected_type:
                print(f"✓ Document type inference for {filename}: {inferred_type}")
            else:
                print(f"✗ Document type inference failed for {filename}")
                return False
        
        # Test sample data generation
        sample_data = processor.get_sample_data("vendor_invoice", "test_invoice.pdf")
        if sample_data and "invoices" in sample_data:
            print("✓ Sample data generation successful")
        else:
            print("✗ Sample data generation failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Document processor test failed: {e}")
        return False

async def test_ai_orchestrator():
    """Test AI orchestrator service"""
    print("\nTesting AI orchestrator...")
    
    try:
        from app.services.ai_orchestrator import AIOrchestrator
        
        orchestrator = AIOrchestrator()
        
        # Test agent configuration
        expected_agents = [
            "ClassifierBot", "DataExtractor", "JournalBot", 
            "GSTValidator", "TDSValidator", "ConsoAI", "AuditAgent"
        ]
        
        for agent_id in expected_agents:
            if agent_id in orchestrator.agents:
                agent_config = orchestrator.agents[agent_id]
                if all(key in agent_config for key in ['name', 'description', 'model', 'system_prompt']):
                    print(f"✓ {agent_id} configuration is complete")
                else:
                    print(f"✗ {agent_id} configuration incomplete")
                    return False
            else:
                print(f"✗ {agent_id} not found in agents")
                return False
        
        # Test workflow listing
        workflows = await orchestrator.get_workflows("test_user")
        if len(workflows) == 7:
            print("✓ AI workflows listing successful")
        else:
            print("✗ AI workflows listing failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ AI orchestrator test failed: {e}")
        return False

async def test_compliance_checker():
    """Test compliance checker service"""
    print("\nTesting compliance checker...")
    
    try:
        from app.services.compliance_checker import ComplianceChecker
        
        checker = ComplianceChecker()
        
        # Test GSTIN validation
        valid_gstin = "09ABCDE1234F1Z5"
        invalid_gstin = "INVALID_GSTIN"
        
        if checker._validate_gstin(valid_gstin):
            print("✓ Valid GSTIN validation successful")
        else:
            print("✗ Valid GSTIN validation failed")
            return False
        
        if not checker._validate_gstin(invalid_gstin):
            print("✓ Invalid GSTIN validation successful")
        else:
            print("✗ Invalid GSTIN validation failed")
            return False
        
        # Test TAN validation
        valid_tan = "ABCD12345E"
        invalid_tan = "INVALID_TAN"
        
        if checker._validate_tan(valid_tan):
            print("✓ Valid TAN validation successful")
        else:
            print("✗ Valid TAN validation failed")
            return False
        
        if not checker._validate_tan(invalid_tan):
            print("✓ Invalid TAN validation successful")
        else:
            print("✗ Invalid TAN validation failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Compliance checker test failed: {e}")
        return False

async def test_financial_reports():
    """Test financial reports service"""
    print("\nTesting financial reports...")
    
    try:
        from app.services.financial_reports import FinancialReportsService
        
        reports_service = FinancialReportsService()
        
        # Test statement types
        expected_statement_types = [
            'trial_balance', 'profit_loss', 'balance_sheet', 'cash_flow'
        ]
        
        for statement_type in expected_statement_types:
            if statement_type in reports_service.statement_types:
                print(f"✓ {statement_type} is available")
            else:
                print(f"✗ {statement_type} is missing")
                return False
        
        # Test statement generation
        trial_balance = reports_service._generate_trial_balance("Q1_2025")
        if trial_balance and 'accounts' in trial_balance:
            print("✓ Trial balance generation successful")
        else:
            print("✗ Trial balance generation failed")
            return False
        
        profit_loss = reports_service._generate_profit_loss("Q1_2025")
        if profit_loss and 'revenue' in profit_loss and 'expenses' in profit_loss:
            print("✓ Profit & Loss generation successful")
        else:
            print("✗ Profit & Loss generation failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Financial reports test failed: {e}")
        return False

def test_fastapi_app():
    """Test FastAPI application structure"""
    print("\nTesting FastAPI application...")
    
    try:
        from main import app
        from fastapi.testclient import TestClient
        
        # Test app initialization
        if app.title == "QRT Closure Agent Platform":
            print("✓ FastAPI app title is correct")
        else:
            print("✗ FastAPI app title is incorrect")
            return False
        
        # Test route registration
        routes = [route.path for route in app.routes]
        expected_routes = [
            "/api/auth/login",
            "/api/auth/user",
            "/api/onboarding",
            "/api/documents/upload",
            "/api/dashboard/stats",
            "/api/compliance-checks",
            "/api/financial-statements",
            "/api/workflows",
            "/api/health"
        ]
        
        for route in expected_routes:
            if route in routes:
                print(f"✓ Route {route} is registered")
            else:
                print(f"✗ Route {route} is missing")
                return False
        
        return True
        
    except Exception as e:
        print(f"✗ FastAPI app test failed: {e}")
        return False

def test_database_connection():
    """Test database connection and setup"""
    print("\nTesting database connection...")
    
    try:
        from app.database import engine, Base
        from sqlalchemy import text
        
        # Test database connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            if result.fetchone()[0] == 1:
                print("✓ Database connection successful")
            else:
                print("✗ Database connection failed")
                return False
        
        # Test table creation
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully")
        
        return True
        
    except Exception as e:
        print(f"✗ Database connection test failed: {e}")
        return False

async def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("QRT Closure Platform - Python/FastAPI Testing Suite")
    print("=" * 60)
    
    test_results = []
    
    # Run synchronous tests
    test_results.append(("Module Imports", test_imports()))
    test_results.append(("Configuration", test_configuration()))
    test_results.append(("Authentication", test_authentication()))
    test_results.append(("Database Models", test_database_models()))
    test_results.append(("Pydantic Schemas", test_pydantic_schemas()))
    test_results.append(("FastAPI App", test_fastapi_app()))
    test_results.append(("Database Connection", test_database_connection()))
    
    # Run asynchronous tests
    test_results.append(("Document Processor", await test_document_processor()))
    test_results.append(("AI Orchestrator", await test_ai_orchestrator()))
    test_results.append(("Compliance Checker", await test_compliance_checker()))
    test_results.append(("Financial Reports", await test_financial_reports()))
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        status = "✓ PASSED" if result else "✗ FAILED"
        print(f"{test_name:<25} {status}")
        
        if result:
            passed += 1
        else:
            failed += 1
    
    print("-" * 60)
    print(f"Total Tests: {len(test_results)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/len(test_results)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 All tests passed! The Python/FastAPI refactoring is working correctly.")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please review the errors above.")
    
    return failed == 0

if __name__ == "__main__":
    # Run the test suite
    result = asyncio.run(run_all_tests())
    sys.exit(0 if result else 1)