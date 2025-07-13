#!/usr/bin/env python3
"""
Quick test script to verify the backend functionality
"""
import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing imports...")
    from main import app
    print("✓ FastAPI app imported successfully")
    
    from app.services.auth_service import AuthService
    print("✓ AuthService imported successfully")
    
    from app.database import get_db
    print("✓ Database connection imported successfully")
    
    # Test database connection
    db = next(get_db())
    print("✓ Database connection established")
    
    # Test auth service
    auth_service = AuthService()
    print("✓ AuthService instantiated")
    
    print("\n🎉 All imports and basic functionality working!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)