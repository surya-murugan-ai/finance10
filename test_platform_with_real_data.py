#!/usr/bin/env python3
"""
Test the QRT Closure Agent Platform with real uploaded Excel files
"""

import requests
import json
import os
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
AUTH_TOKEN = "eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0="

# Headers for API requests
headers = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

def upload_file(file_path, document_type):
    """Upload a file through the platform API"""
    try:
        url = f"{BASE_URL}/api/documents/upload"
        
        # Prepare file for upload
        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {'documentType': document_type}
            
            # Remove Content-Type header for multipart upload
            upload_headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
            
            response = requests.post(url, files=files, data=data, headers=upload_headers)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ Successfully uploaded {file_path} as {document_type}")
                print(f"  Document ID: {result.get('id')}")
                print(f"  Classification: {result.get('classification')}")
                return result
            else:
                print(f"✗ Failed to upload {file_path}: {response.status_code}")
                print(f"  Error: {response.text}")
                return None
                
    except Exception as e:
        print(f"✗ Error uploading {file_path}: {str(e)}")
        return None

def get_documents():
    """Get all documents from the platform"""
    try:
        url = f"{BASE_URL}/api/documents"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            documents = response.json()
            print(f"✓ Retrieved {len(documents)} documents")
            return documents
        else:
            print(f"✗ Failed to get documents: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"✗ Error getting documents: {str(e)}")
        return []

def generate_journal_entries():
    """Generate journal entries from uploaded documents"""
    try:
        url = f"{BASE_URL}/api/reports/generate-journal-entries"
        response = requests.post(url, headers=headers, json={})
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Generated journal entries")
            print(f"  Total: {result.get('totalEntries', 0)} entries")
            print(f"  Processed: {result.get('documentsProcessed', 0)} documents")
            print(f"  Skipped: {result.get('skippedDocuments', 0)} documents")
            return result
        else:
            print(f"✗ Failed to generate journal entries: {response.status_code}")
            print(f"  Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ Error generating journal entries: {str(e)}")
        return None

def get_journal_entries():
    """Get all journal entries"""
    try:
        url = f"{BASE_URL}/api/journal-entries"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            entries = response.json()
            print(f"✓ Retrieved {len(entries)} journal entries")
            return entries
        else:
            print(f"✗ Failed to get journal entries: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"✗ Error getting journal entries: {str(e)}")
        return []

def generate_trial_balance():
    """Generate trial balance report"""
    try:
        url = f"{BASE_URL}/api/reports/trial-balance"
        data = {"period": "Q2_2025"}
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Generated trial balance")
            print(f"  Total Debits: {result.get('totalDebitsText', 'N/A')}")
            print(f"  Total Credits: {result.get('totalCreditsText', 'N/A')}")
            print(f"  Balanced: {result.get('isBalanced', False)}")
            return result
        else:
            print(f"✗ Failed to generate trial balance: {response.status_code}")
            print(f"  Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"✗ Error generating trial balance: {str(e)}")
        return None

def generate_financial_reports():
    """Generate P&L and Balance Sheet reports"""
    reports = ["profit-loss", "balance-sheet"]
    results = {}
    
    for report_type in reports:
        try:
            url = f"{BASE_URL}/api/reports/{report_type}"
            data = {"period": "Q2_2025"}
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 200:
                result = response.json()
                results[report_type] = result
                print(f"✓ Generated {report_type} report")
                
                if report_type == "profit-loss":
                    print(f"  Total Revenue: Rs {result.get('totalRevenue', 0):,}")
                    print(f"  Total Expenses: Rs {result.get('totalExpenses', 0):,}")
                    print(f"  Net Profit/Loss: Rs {result.get('netProfitLoss', 0):,}")
                elif report_type == "balance-sheet":
                    print(f"  Total Assets: Rs {result.get('totalAssets', 0):,}")
                    print(f"  Total Liabilities: Rs {result.get('totalLiabilities', 0):,}")
                    print(f"  Total Equity: Rs {result.get('totalEquity', 0):,}")
                    
            else:
                print(f"✗ Failed to generate {report_type}: {response.status_code}")
                print(f"  Error: {response.text}")
                
        except Exception as e:
            print(f"✗ Error generating {report_type}: {str(e)}")
    
    return results

def main():
    """Main test function"""
    print("="*60)
    print("QRT Closure Agent Platform - Real Data Test")
    print("="*60)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test files to upload
    test_files = [
        ("uploads/sales_register.xlsx", "sales_register"),
        ("uploads/bank_statement.xlsx", "bank_statement"),
        ("uploads/purchase_register.xlsx", "purchase_register")
    ]
    
    uploaded_documents = []
    
    # Step 1: Upload files
    print("Step 1: Uploading documents...")
    print("-" * 40)
    for file_path, doc_type in test_files:
        if os.path.exists(file_path):
            result = upload_file(file_path, doc_type)
            if result:
                uploaded_documents.append(result)
        else:
            print(f"✗ File not found: {file_path}")
    
    print(f"\nUploaded {len(uploaded_documents)} documents successfully\n")
    
    # Step 2: Get documents
    print("Step 2: Retrieving documents...")
    print("-" * 40)
    documents = get_documents()
    print()
    
    # Step 3: Generate journal entries
    print("Step 3: Generating journal entries...")
    print("-" * 40)
    journal_result = generate_journal_entries()
    print()
    
    # Step 4: Get journal entries
    print("Step 4: Retrieving journal entries...")
    print("-" * 40)
    journal_entries = get_journal_entries()
    print()
    
    # Step 5: Generate trial balance
    print("Step 5: Generating trial balance...")
    print("-" * 40)
    trial_balance = generate_trial_balance()
    print()
    
    # Step 6: Generate financial reports
    print("Step 6: Generating financial reports...")
    print("-" * 40)
    financial_reports = generate_financial_reports()
    print()
    
    # Summary
    print("="*60)
    print("Test Summary")
    print("="*60)
    print(f"Documents uploaded: {len(uploaded_documents)}")
    print(f"Total documents in system: {len(documents)}")
    print(f"Journal entries created: {len(journal_entries)}")
    print(f"Trial balance generated: {'✓' if trial_balance else '✗'}")
    print(f"Financial reports generated: {len(financial_reports)}")
    print(f"Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Save results
    results = {
        "test_timestamp": datetime.now().isoformat(),
        "uploaded_documents": uploaded_documents,
        "documents": documents,
        "journal_entries": journal_entries,
        "trial_balance": trial_balance,
        "financial_reports": financial_reports
    }
    
    with open("test_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\nDetailed results saved to: test_results.json")

if __name__ == "__main__":
    main()