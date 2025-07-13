#!/usr/bin/env python3
"""
Integration test for the complete QRT Closure Platform - Python/FastAPI version
"""

import sys
import os
import asyncio
import json
from datetime import datetime
from fastapi.testclient import TestClient

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_integration_test():
    """Run comprehensive integration tests"""
    
    print("=" * 70)
    print("QRT CLOSURE PLATFORM - INTEGRATION TEST")
    print("=" * 70)
    
    # Test 1: Import and validate core components
    print("\n1. CORE SYSTEM VALIDATION")
    print("-" * 40)
    
    try:
        from main import app
        from app.config import settings
        from app.models import User, Document, ComplianceCheck, AuditTrail
        from app.services.ai_orchestrator import AIOrchestrator
        from app.services.document_processor import DocumentProcessor
        from app.services.compliance_checker import ComplianceChecker
        from app.services.financial_reports import FinancialReportsService
        print("✓ All core components imported successfully")
    except Exception as e:
        print(f"✗ Core component import failed: {e}")
        return False
    
    # Test 2: FastAPI application setup
    print("\n2. FASTAPI APPLICATION SETUP")
    print("-" * 40)
    
    try:
        client = TestClient(app)
        
        # Test health endpoint
        response = client.get("/api/health")
        assert response.status_code == 200
        health_data = response.json()
        assert health_data["status"] == "healthy"
        print("✓ Health endpoint functional")
        
        # Test API documentation endpoints
        response = client.get("/openapi.json")
        assert response.status_code == 200
        openapi_spec = response.json()
        assert "paths" in openapi_spec
        print(f"✓ OpenAPI documentation with {len(openapi_spec['paths'])} endpoints")
        
    except Exception as e:
        print(f"✗ FastAPI setup failed: {e}")
        return False
    
    # Test 3: Authentication system
    print("\n3. AUTHENTICATION SYSTEM")
    print("-" * 40)
    
    try:
        # Test login endpoint
        login_data = {"email": "test@example.com", "password": "password123"}
        response = client.post("/api/auth/login", json=login_data)
        assert response.status_code == 200
        auth_data = response.json()
        assert "access_token" in auth_data
        token = auth_data["access_token"]
        print("✓ Login endpoint working")
        
        # Test authenticated endpoint
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/auth/user", headers=headers)
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["email"] == "test@example.com"
        print("✓ JWT authentication working")
        
    except Exception as e:
        print(f"✗ Authentication failed: {e}")
        return False
    
    # Test 4: Service layer validation
    print("\n4. SERVICE LAYER VALIDATION")
    print("-" * 40)
    
    try:
        test_service_layer()
        print("✓ All service layers functional")
    except Exception as e:
        print(f"✗ Service layer failed: {e}")
        return False
    
    # Test 5: Database operations
    print("\n5. DATABASE OPERATIONS")
    print("-" * 40)
    
    try:
        test_database_operations()
        print("✓ Database operations functional")
    except Exception as e:
        print(f"✗ Database operations failed: {e}")
        return False
    
    # Test 6: Complete workflow test
    print("\n6. COMPLETE WORKFLOW TEST")
    print("-" * 40)
    
    try:
        client = TestClient(app)
        
        # Login
        login_data = {"email": "workflow@test.com", "password": "password123"}
        response = client.post("/api/auth/login", json=login_data)
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get workflows
        response = client.get("/api/workflows", headers=headers)
        assert response.status_code == 200
        workflows = response.json()
        assert len(workflows) > 0
        print("✓ Workflows endpoint working")
        
        # Get dashboard stats
        response = client.get("/api/dashboard/stats", headers=headers)
        assert response.status_code == 200
        stats = response.json()
        assert "documentsProcessed" in stats
        print("✓ Dashboard stats working")
        
        # Get compliance checks
        response = client.get("/api/compliance-checks", headers=headers)
        assert response.status_code == 200
        compliance_checks = response.json()
        print("✓ Compliance checks endpoint working")
        
        # Get financial statements
        response = client.get("/api/financial-statements", headers=headers)
        assert response.status_code == 200
        statements = response.json()
        print("✓ Financial statements endpoint working")
        
    except Exception as e:
        print(f"✗ Complete workflow test failed: {e}")
        return False
    
    # Final summary
    print("\n" + "=" * 70)
    print("INTEGRATION TEST SUMMARY")
    print("=" * 70)
    print("✓ Core system validation")
    print("✓ FastAPI application setup")
    print("✓ Authentication system")
    print("✓ Service layer validation")
    print("✓ Database operations")
    print("✓ Complete workflow test")
    print("\n🎉 ALL INTEGRATION TESTS PASSED!")
    print("The Python/FastAPI platform is fully integrated and functional!")
    
    return True

def test_service_layer():
    """Test the service layer directly"""
    
    # AI Orchestrator test
    orchestrator = AIOrchestrator()
    workflows = asyncio.run(orchestrator.get_workflows("test_user"))
    assert len(workflows) == 7
    
    # Document processor test
    processor = DocumentProcessor()
    doc_type = processor._infer_document_type("test_invoice.pdf")
    assert doc_type == "vendor_invoice"
    
    # Compliance checker test
    checker = ComplianceChecker()
    assert checker._validate_gstin("09ABCDE1234F1Z5") == True
    assert checker._validate_gstin("INVALID") == False
    
    # Financial reports test
    reports = FinancialReportsService()
    trial_balance = reports._generate_trial_balance("Q1_2025")
    assert "accounts" in trial_balance

def test_database_operations():
    """Test database operations"""
    
    from app.database import engine, Base
    from sqlalchemy import text
    
    # Test database connection
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        assert result.fetchone()[0] == 1
    
    # Test table creation
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    success = run_integration_test()
    sys.exit(0 if success else 1)