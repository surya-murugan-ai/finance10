#!/usr/bin/env python3
"""
Test journal entry generation directly
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
AUTH_TOKEN = "eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0="

headers = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

def test_journal_generation():
    """Test journal entry generation"""
    print("Testing journal entry generation...")
    
    # First, let's check what documents exist
    print("1. Checking existing documents...")
    docs_response = requests.get(f"{BASE_URL}/api/documents", headers=headers)
    if docs_response.status_code == 200:
        documents = docs_response.json()
        print(f"   Found {len(documents)} documents")
        for doc in documents:
            print(f"   - {doc.get('originalName', 'N/A')} ({doc.get('documentType', 'N/A')})")
    else:
        print(f"   Error getting documents: {docs_response.status_code}")
        return False
    
    # Try to generate journal entries using the existing endpoint
    print("\n2. Testing journal entry generation...")
    try:
        response = requests.post(f"{BASE_URL}/api/reports/generate-journal-entries", headers=headers, json={})
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✓ Success: {result}")
            return True
        else:
            print(f"   ✗ Failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
        return False

def test_reports():
    """Test financial reports generation"""
    print("\n3. Testing financial reports...")
    
    # Test trial balance
    try:
        response = requests.post(f"{BASE_URL}/api/reports/trial-balance", headers=headers, json={"period": "Q2_2025"})
        print(f"   Trial Balance: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   - Debits: {result.get('totalDebitsText', 'N/A')}")
            print(f"   - Credits: {result.get('totalCreditsText', 'N/A')}")
            print(f"   - Entries: {len(result.get('entries', []))}")
    except Exception as e:
        print(f"   Trial Balance Error: {str(e)}")
    
    # Test P&L
    try:
        response = requests.post(f"{BASE_URL}/api/reports/profit-loss", headers=headers, json={"period": "Q2_2025"})
        print(f"   P&L Report: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   - Revenue: Rs {result.get('totalRevenue', 0):,}")
            print(f"   - Expenses: Rs {result.get('totalExpenses', 0):,}")
            print(f"   - Net: Rs {result.get('netProfitLoss', 0):,}")
    except Exception as e:
        print(f"   P&L Error: {str(e)}")

def main():
    print("="*50)
    print("Journal Entry Generation Test")
    print("="*50)
    
    success = test_journal_generation()
    test_reports()
    
    print("\n" + "="*50)
    print(f"Test completed: {'✓ Success' if success else '✗ Failed'}")
    print("="*50)

if __name__ == "__main__":
    main()