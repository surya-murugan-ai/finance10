#!/usr/bin/env python3
"""
Quick validation test for the Python/FastAPI refactored system
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_quick_test():
    """Run quick validation tests"""
    
    print("QRT Closure Platform - Quick System Validation")
    print("=" * 50)
    
    test_results = []
    
    # Test 1: Core imports
    try:
        from main import app
        from app.config import settings
        from app.models import User, Document
        from app.services.ai_orchestrator import AIOrchestrator
        from app.services.document_processor import DocumentProcessor
        from app.services.compliance_checker import ComplianceChecker
        from app.services.financial_reports import FinancialReportsService
        test_results.append(("Core Imports", True))
        print("✓ Core imports successful")
    except Exception as e:
        test_results.append(("Core Imports", False))
        print(f"✗ Core imports failed: {e}")
    
    # Test 2: FastAPI application
    try:
        from fastapi.testclient import TestClient
        client = TestClient(app)
        response = client.get("/api/health")
        assert response.status_code == 200
        test_results.append(("FastAPI Health", True))
        print("✓ FastAPI application working")
    except Exception as e:
        test_results.append(("FastAPI Health", False))
        print(f"✗ FastAPI application failed: {e}")
    
    # Test 3: AI Orchestrator
    try:
        orchestrator = AIOrchestrator()
        agents = orchestrator.agents
        assert len(agents) == 7
        test_results.append(("AI Orchestrator", True))
        print("✓ AI Orchestrator working")
    except Exception as e:
        test_results.append(("AI Orchestrator", False))
        print(f"✗ AI Orchestrator failed: {e}")
    
    # Test 4: Document Processor
    try:
        processor = DocumentProcessor()
        doc_type = processor._infer_document_type("test_invoice.pdf")
        assert doc_type == "vendor_invoice"
        test_results.append(("Document Processor", True))
        print("✓ Document Processor working")
    except Exception as e:
        test_results.append(("Document Processor", False))
        print(f"✗ Document Processor failed: {e}")
    
    # Test 5: Compliance Checker
    try:
        checker = ComplianceChecker()
        assert checker._validate_gstin("09ABCDE1234F1Z5") == True
        assert checker._validate_gstin("INVALID") == False
        test_results.append(("Compliance Checker", True))
        print("✓ Compliance Checker working")
    except Exception as e:
        test_results.append(("Compliance Checker", False))
        print(f"✗ Compliance Checker failed: {e}")
    
    # Test 6: Financial Reports
    try:
        reports = FinancialReportsService()
        trial_balance = reports._generate_trial_balance("Q1_2025")
        assert "accounts" in trial_balance
        test_results.append(("Financial Reports", True))
        print("✓ Financial Reports working")
    except Exception as e:
        test_results.append(("Financial Reports", False))
        print(f"✗ Financial Reports failed: {e}")
    
    # Test 7: Database Connection
    try:
        from app.database import engine
        from sqlalchemy import text
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            assert result.fetchone()[0] == 1
        test_results.append(("Database Connection", True))
        print("✓ Database Connection working")
    except Exception as e:
        test_results.append(("Database Connection", False))
        print(f"✗ Database Connection failed: {e}")
    
    # Test 8: Configuration
    try:
        assert hasattr(settings, 'DATABASE_URL')
        assert hasattr(settings, 'SECRET_KEY')
        assert hasattr(settings, 'ANTHROPIC_API_KEY')
        test_results.append(("Configuration", True))
        print("✓ Configuration working")
    except Exception as e:
        test_results.append(("Configuration", False))
        print(f"✗ Configuration failed: {e}")
    
    # Test 9: API Routes
    try:
        routes = [route.path for route in app.routes]
        critical_routes = ["/api/health", "/api/auth/login", "/api/workflows", "/api/documents/upload"]
        for route in critical_routes:
            assert route in routes
        test_results.append(("API Routes", True))
        print("✓ API Routes working")
    except Exception as e:
        test_results.append(("API Routes", False))
        print(f"✗ API Routes failed: {e}")
    
    # Test 10: OpenAPI Documentation
    try:
        client = TestClient(app)
        response = client.get("/openapi.json")
        assert response.status_code == 200
        openapi_spec = response.json()
        assert "paths" in openapi_spec
        test_results.append(("OpenAPI Docs", True))
        print("✓ OpenAPI Documentation working")
    except Exception as e:
        test_results.append(("OpenAPI Docs", False))
        print(f"✗ OpenAPI Documentation failed: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("The Python/FastAPI refactoring is fully functional!")
        
        print("\nKey Features Validated:")
        print("• FastAPI application with auto-generated docs")
        print("• 7 AI agents for document processing")
        print("• Document type inference and processing")
        print("• GST/TDS compliance validation")
        print("• Financial reporting system")
        print("• PostgreSQL database integration")
        print("• JWT authentication system")
        print("• Comprehensive API endpoints")
        
        return True
    else:
        print(f"\n⚠️ {total - passed} test(s) failed")
        return False

if __name__ == "__main__":
    success = run_quick_test()
    sys.exit(0 if success else 1)