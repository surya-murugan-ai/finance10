#!/usr/bin/env python3
"""
Journal Entry Validation Script
Compares platform-generated journal entries with manual calculations
"""

import json
import requests
from collections import defaultdict

# Authentication token
TOKEN = "eyJ1c2VySWQiOiI5ZTM2YzRkYi01NmM0LTQxNzUtOTk2Mi03ZDEwM2RiMmMxY2QiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIn0="
BASE_URL = "http://localhost:5000"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def get_platform_journal_entries():
    """Get journal entries from platform"""
    response = requests.get(f"{BASE_URL}/api/journal-entries", headers=headers)
    return response.json()

def get_documents():
    """Get all documents"""
    response = requests.get(f"{BASE_URL}/api/documents", headers=headers)
    return response.json()

def analyze_platform_entries():
    """Analyze platform journal entries"""
    entries = get_platform_journal_entries()
    documents = get_documents()
    
    # Create document lookup
    doc_lookup = {doc['id']: doc for doc in documents}
    
    # Group entries by document
    entries_by_doc = defaultdict(list)
    for entry in entries:
        doc_id = entry['documentId']
        entries_by_doc[doc_id].append(entry)
    
    print("=== PLATFORM JOURNAL ENTRIES ANALYSIS ===")
    print(f"Total entries: {len(entries)}")
    print(f"Documents processed: {len(entries_by_doc)}")
    
    total_debits = 0
    total_credits = 0
    
    for doc_id, doc_entries in entries_by_doc.items():
        doc_name = doc_lookup.get(doc_id, {}).get('originalName', 'Unknown')
        print(f"\n--- Document: {doc_name} ---")
        
        doc_debits = 0
        doc_credits = 0
        
        for entry in doc_entries:
            debit = float(entry['debitAmount'])
            credit = float(entry['creditAmount'])
            
            doc_debits += debit
            doc_credits += credit
            
            if debit > 0:
                print(f"  Dr {entry['accountCode']} {entry['accountName']}: ₹{debit:,.2f}")
            if credit > 0:
                print(f"  Cr {entry['accountCode']} {entry['accountName']}: ₹{credit:,.2f}")
        
        print(f"  Document Total: Dr ₹{doc_debits:,.2f} | Cr ₹{doc_credits:,.2f}")
        
        if abs(doc_debits - doc_credits) > 0.01:
            print(f"  ⚠️  WARNING: Document not balanced! Difference: ₹{abs(doc_debits - doc_credits):,.2f}")
        else:
            print(f"  ✓ Document balanced")
        
        total_debits += doc_debits
        total_credits += doc_credits
    
    print(f"\n=== OVERALL SUMMARY ===")
    print(f"Total Debits: ₹{total_debits:,.2f}")
    print(f"Total Credits: ₹{total_credits:,.2f}")
    print(f"Balance Check: {'✓ BALANCED' if abs(total_debits - total_credits) < 0.01 else '⚠️ NOT BALANCED'}")
    
    return entries, documents

def analyze_account_codes():
    """Analyze account code distribution"""
    entries = get_platform_journal_entries()
    
    account_summary = defaultdict(lambda: {'debits': 0, 'credits': 0, 'count': 0})
    
    for entry in entries:
        account_code = entry['accountCode']
        account_name = entry['accountName']
        debit = float(entry['debitAmount'])
        credit = float(entry['creditAmount'])
        
        account_summary[account_code]['debits'] += debit
        account_summary[account_code]['credits'] += credit
        account_summary[account_code]['count'] += 1
        account_summary[account_code]['name'] = account_name
    
    print("\n=== ACCOUNT CODE SUMMARY ===")
    for code, data in sorted(account_summary.items()):
        net_balance = data['debits'] - data['credits']
        print(f"{code} {data['name']}:")
        print(f"  Debits: ₹{data['debits']:,.2f} | Credits: ₹{data['credits']:,.2f} | Net: ₹{net_balance:,.2f}")
        print(f"  Entries: {data['count']}")

def main():
    print("=== JOURNAL ENTRY VALIDATION ===")
    print("Analyzing platform-generated journal entries...")
    
    analyze_platform_entries()
    analyze_account_codes()
    
    print("\n=== MANUAL VALIDATION COMPARISON ===")
    print("Based on your manual calculations image:")
    print("1. Check if the account codes match your expectations")
    print("2. Verify the amounts are correctly calculated")
    print("3. Ensure all documents are properly balanced")
    print("4. Compare the account code classifications")
    
    print("\n=== NEXT STEPS ===")
    print("Please review the above analysis and let me know:")
    print("1. Are the account codes correct for each document type?")
    print("2. Do the amounts match your manual calculations?")
    print("3. Are there any discrepancies that need to be addressed?")

if __name__ == "__main__":
    main()