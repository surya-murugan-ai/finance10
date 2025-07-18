#!/usr/bin/env python3
"""
Process additional Excel files and create journal entries to reach target amount
"""

import requests
import json
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
JWT_TOKEN = "eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0="

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

def upload_document(file_path, doc_type):
    """Upload document to platform"""
    try:
        print(f"Uploading {os.path.basename(file_path)}...")
        
        with open(file_path, 'rb') as f:
            files = {
                'file': (os.path.basename(file_path), f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            }
            data = {
                'documentType': doc_type,
                'period': 'Q1_2025'
            }
            
            # Remove Content-Type header for multipart
            upload_headers = {"Authorization": f"Bearer {JWT_TOKEN}"}
            
            response = requests.post(f"{BASE_URL}/api/documents/upload", 
                                   headers=upload_headers, 
                                   files=files, 
                                   data=data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Upload successful: {result['message']}")
                return result.get('document', {}).get('id')
            else:
                print(f"❌ Upload failed: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ Error uploading {file_path}: {str(e)}")
        return None

def generate_journal_entries():
    """Generate journal entries for all uploaded documents"""
    try:
        print("Generating journal entries...")
        
        response = requests.post(f"{BASE_URL}/api/journal-entries/generate", 
                               headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Journal entries generated: {result['message']}")
            print(f"   Total entries: {result.get('totalEntries', 0)}")
            print(f"   Processed documents: {result.get('processedDocuments', 0)}")
            return True
        else:
            print(f"❌ Journal generation failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error generating journal entries: {str(e)}")
        return False

def get_trial_balance():
    """Get updated trial balance"""
    try:
        print("Fetching updated trial balance...")
        
        response = requests.post(f"{BASE_URL}/api/reports/trial-balance", 
                               headers=headers, 
                               json={"period": "Q1_2025"})
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Trial balance retrieved:")
            print(f"   Total entries: {len(result.get('entries', []))}")
            print(f"   Total debits: {result.get('totalDebitsText', 'N/A')}")
            print(f"   Total credits: {result.get('totalCreditsText', 'N/A')}")
            print(f"   Balanced: {result.get('isBalanced', False)}")
            return result
        else:
            print(f"❌ Trial balance failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error fetching trial balance: {str(e)}")
        return None

def main():
    """Main processing function"""
    print("PROCESSING ADDITIONAL FILES TO REACH TARGET AMOUNT")
    print("=" * 60)
    
    # Files to process
    files_to_process = [
        ("uploads/DB Bank Apr-Jun HO_1752770758283.xlsx", "bank_statement"),
        ("uploads/Purchase Reg Apr-Jun Chennai_1752770758284.xlsx", "purchase_register"),
        ("uploads/Sales Reg Apr-Jun Chennai_1752770758282.xlsx", "sales_register"),
        ("uploads/TrialBal Chennai_1752771337601.xlsx", "trial_balance"),
        ("uploads/TrialBal Chennai_1752771856984.xlsx", "trial_balance")
    ]
    
    # Upload each file
    uploaded_docs = []
    for file_path, doc_type in files_to_process:
        if os.path.exists(file_path):
            doc_id = upload_document(file_path, doc_type)
            if doc_id:
                uploaded_docs.append(doc_id)
        else:
            print(f"❌ File not found: {file_path}")
    
    print(f"\nUploaded {len(uploaded_docs)} documents")
    
    if uploaded_docs:
        # Generate journal entries
        if generate_journal_entries():
            # Get updated trial balance
            trial_balance = get_trial_balance()
            
            if trial_balance:
                # Calculate progress
                target_amount = 145787998.21
                current_debits = trial_balance.get('totalDebits', 0)
                current_credits = trial_balance.get('totalCredits', 0)
                
                print(f"\n{'='*60}")
                print("PROGRESS SUMMARY")
                print(f"{'='*60}")
                print(f"Target Amount: ₹{target_amount:,.2f}")
                print(f"Current Debits: ₹{current_debits:,.2f}")
                print(f"Current Credits: ₹{current_credits:,.2f}")
                print(f"Progress: {(current_debits / target_amount) * 100:.1f}%")
                
                if current_debits >= target_amount:
                    print("🎉 TARGET ACHIEVED!")
                else:
                    remaining = target_amount - current_debits
                    print(f"Remaining Gap: ₹{remaining:,.2f}")
    
    print("\nProcessing complete!")

if __name__ == "__main__":
    main()