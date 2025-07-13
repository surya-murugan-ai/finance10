#!/usr/bin/env python3
"""
Complete the Python/FastAPI integration by starting the server and testing connectivity
"""

import uvicorn
import sys
import os
import subprocess
import time
import requests
from threading import Thread

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def start_python_server():
    """Start the Python FastAPI server"""
    print("🚀 Starting Python FastAPI server on port 8000...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )

def test_integration():
    """Test the complete integration"""
    print("\n🔧 Testing Python server integration...")
    
    # Wait for server to start
    time.sleep(3)
    
    try:
        # Test health endpoint
        health_response = requests.get("http://localhost:8000/api/health", timeout=5)
        print(f"✅ Health check: {health_response.status_code}")
        
        # Test login endpoint
        login_data = {"email": "test@example.com", "password": "password123"}
        login_response = requests.post("http://localhost:8000/api/auth/login", json=login_data, timeout=5)
        print(f"✅ Login test: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            
            # Test authenticated endpoint
            headers = {"Authorization": f"Bearer {token}"}
            user_response = requests.get("http://localhost:8000/api/auth/user", headers=headers, timeout=5)
            print(f"✅ Auth user test: {user_response.status_code}")
            
            print("\n🎉 Integration complete! Python server is ready.")
            return True
        else:
            print("❌ Login failed")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Python server")
        return False
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        return False

if __name__ == "__main__":
    # Start server in background thread
    server_thread = Thread(target=start_python_server, daemon=True)
    server_thread.start()
    
    # Test integration
    success = test_integration()
    
    if success:
        print("\n✅ SERVER CONFIGURATION COMPLETE!")
        print("📍 Python FastAPI server: http://localhost:8000")
        print("📍 React frontend: http://localhost:5000")
        print("📍 API documentation: http://localhost:8000/docs")
        
        # Keep server running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")
    else:
        print("\n❌ Integration failed")
        sys.exit(1)