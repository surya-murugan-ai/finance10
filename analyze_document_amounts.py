#!/usr/bin/env python3
"""
Analyze the actual amounts in uploaded documents vs generated journal entries
"""

import pandas as pd
import requests
import json
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
AUTH_TOKEN = "eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0="

headers = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

def analyze_uploaded_documents():
    """Analyze the actual content of uploaded documents"""
    print("Analyzing uploaded documents...")
    
    # Check what files exist in uploads directory
    uploads_dir = "uploads"
    if os.path.exists(uploads_dir):
        files = os.listdir(uploads_dir)
        print(f"Files in uploads directory: {files}")
        
        for file in files:
            if file.endswith(('.xlsx', '.xls')):
                file_path = os.path.join(uploads_dir, file)
                print(f"\nAnalyzing {file}:")
                
                try:
                    # Read Excel file
                    df = pd.read_excel(file_path)
                    print(f"Shape: {df.shape}")
                    print(f"Columns: {list(df.columns)}")
                    
                    # Look for amount columns
                    amount_columns = []
                    for col in df.columns:
                        if any(keyword in str(col).lower() for keyword in ['amount', 'value', 'total', 'debit', 'credit', 'balance']):
                            amount_columns.append(col)
                    
                    print(f"Amount columns found: {amount_columns}")
                    
                    # Calculate totals from amount columns
                    for col in amount_columns:
                        try:
                            numeric_data = pd.to_numeric(df[col], errors='coerce')
                            total = numeric_data.sum()
                            print(f"  {col}: Total = Rs {total:,.2f}")
                        except:
                            print(f"  {col}: Could not calculate total")
                    
                    # Show sample data
                    print(f"Sample data (first 5 rows):")
                    print(df.head().to_string())
                    
                except Exception as e:
                    print(f"Error reading {file}: {str(e)}")
    else:
        print("No uploads directory found")

def get_platform_journal_entries():
    """Get journal entries from platform"""
    print("\nFetching journal entries from platform...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/journal-entries", headers=headers)
        
        if response.status_code == 200:
            entries = response.json()
            print(f"Found {len(entries)} journal entries")
            
            total_debits = 0
            total_credits = 0
            
            for entry in entries:
                debit = entry.get('debitAmount', 0)
                credit = entry.get('creditAmount', 0)
                total_debits += debit
                total_credits += credit
                
                print(f"Entry: {entry.get('accountCode', 'N/A')} - {entry.get('accountName', 'N/A')}")
                print(f"  Debit: Rs {debit:,.2f}, Credit: Rs {credit:,.2f}")
                print(f"  Narration: {entry.get('narration', 'N/A')}")
                print(f"  Entity: {entry.get('entity', 'N/A')}")
                print()
            
            print(f"Total Debits: Rs {total_debits:,.2f}")
            print(f"Total Credits: Rs {total_credits:,.2f}")
            
            return entries
        else:
            print(f"Error fetching journal entries: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"Error fetching journal entries: {str(e)}")
        return []

def analyze_expected_vs_actual():
    """Compare expected amounts from Excel vs actual generated amounts"""
    print("\n" + "="*60)
    print("EXPECTED VS ACTUAL AMOUNTS ANALYSIS")
    print("="*60)
    
    # Expected amounts from Excel trial balance
    expected_amounts = {
        "Current Liabilities": 2649280,
        "Duties & Taxes": 157180,
        "Current Assets": 18741067.6
    }
    
    print("Expected amounts from Excel trial balance:")
    for account, amount in expected_amounts.items():
        print(f"  {account}: Rs {amount:,.2f}")
    
    print(f"\nTotal expected debits: Rs {(157180 + 18741067.6):,.2f}")
    print(f"Total expected credits: Rs {2649280:,.2f}")
    
    # Get actual platform amounts
    journal_entries = get_platform_journal_entries()
    
    if journal_entries:
        actual_debits = sum(entry.get('debitAmount', 0) for entry in journal_entries)
        actual_credits = sum(entry.get('creditAmount', 0) for entry in journal_entries)
        
        print(f"\nActual platform amounts:")
        print(f"  Total debits: Rs {actual_debits:,.2f}")
        print(f"  Total credits: Rs {actual_credits:,.2f}")
        
        print(f"\nDiscrepancy:")
        print(f"  Debits difference: Rs {((157180 + 18741067.6) - actual_debits):,.2f}")
        print(f"  Credits difference: Rs {(2649280 - actual_credits):,.2f}")

def main():
    print("="*60)
    print("DOCUMENT AMOUNTS ANALYSIS")
    print("="*60)
    
    # Analyze uploaded documents
    analyze_uploaded_documents()
    
    # Compare expected vs actual
    analyze_expected_vs_actual()
    
    print("\n" + "="*60)
    print("ANALYSIS COMPLETE")
    print("="*60)

if __name__ == "__main__":
    main()