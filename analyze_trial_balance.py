#!/usr/bin/env python3
"""
Analyze the trial balance Excel file and compare with platform calculations
"""

import pandas as pd
import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
AUTH_TOKEN = "eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0="
EXCEL_FILE = "attached_assets/TrialBal Chennai_1752771337601.xlsx"

headers = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

def read_excel_trial_balance():
    """Read the trial balance from Excel file"""
    try:
        print("Reading trial balance from Excel file...")
        
        # Try different sheet names that might contain the trial balance
        possible_sheets = [0, 'Sheet1', 'Trial Balance', 'TrialBal', 'TB']
        
        for sheet in possible_sheets:
            try:
                df = pd.read_excel(EXCEL_FILE, sheet_name=sheet)
                print(f"Successfully read sheet: {sheet}")
                print(f"Shape: {df.shape}")
                print(f"Columns: {list(df.columns)}")
                
                # Display first few rows
                print("\nFirst 10 rows:")
                print(df.head(10).to_string())
                
                # Look for key columns that indicate trial balance
                if any(col for col in df.columns if 'debit' in str(col).lower() or 'credit' in str(col).lower()):
                    print(f"\nFound trial balance data in sheet: {sheet}")
                    return df
                    
            except Exception as e:
                print(f"Couldn't read sheet {sheet}: {str(e)}")
                continue
        
        print("No trial balance data found in any sheet")
        return None
        
    except Exception as e:
        print(f"Error reading Excel file: {str(e)}")
        return None

def get_platform_trial_balance():
    """Get trial balance from the platform"""
    try:
        print("\nFetching trial balance from platform...")
        response = requests.post(f"{BASE_URL}/api/reports/trial-balance", headers=headers, json={"period": "Q2_2025"})
        
        if response.status_code == 200:
            result = response.json()
            print(f"Platform trial balance retrieved successfully")
            print(f"Total entries: {len(result.get('entries', []))}")
            print(f"Total debits: {result.get('totalDebitsText', 'N/A')}")
            print(f"Total credits: {result.get('totalCreditsText', 'N/A')}")
            return result
        else:
            print(f"Error fetching platform trial balance: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"Error fetching platform trial balance: {str(e)}")
        return None

def compare_trial_balances(excel_df, platform_data):
    """Compare Excel trial balance with platform trial balance"""
    print("\n" + "="*60)
    print("TRIAL BALANCE COMPARISON")
    print("="*60)
    
    if excel_df is None or platform_data is None:
        print("Cannot compare - missing data")
        return
    
    # Extract platform entries
    platform_entries = platform_data.get('entries', [])
    
    print(f"\nExcel file has {len(excel_df)} rows")
    print(f"Platform has {len(platform_entries)} entries")
    
    # Try to find totals in Excel
    excel_totals = {"debits": 0, "credits": 0}
    
    # Look for total rows in Excel
    for idx, row in excel_df.iterrows():
        row_str = str(row.values).lower()
        if 'total' in row_str:
            print(f"\nFound total row at index {idx}:")
            print(row.to_string())
    
    # Calculate totals from platform
    platform_totals = {
        "debits": platform_data.get('totalDebits', 0),
        "credits": platform_data.get('totalCredits', 0)
    }
    
    print(f"\nPlatform Totals:")
    print(f"  Debits: Rs {platform_totals['debits']:,}")
    print(f"  Credits: Rs {platform_totals['credits']:,}")
    
    # Display platform entries
    print(f"\nPlatform Trial Balance Entries:")
    for entry in platform_entries:
        print(f"  {entry.get('accountCode', 'N/A')} - {entry.get('accountName', 'N/A')}")
        print(f"    Debit: {entry.get('debitBalanceText', 'Rs 0')}")
        print(f"    Credit: {entry.get('creditBalanceText', 'Rs 0')}")
        print(f"    Entity: {entry.get('entity', 'N/A')}")
        print()

def main():
    print("="*60)
    print("TRIAL BALANCE ANALYSIS")
    print("="*60)
    
    # Read Excel file
    excel_df = read_excel_trial_balance()
    
    # Get platform data
    platform_data = get_platform_trial_balance()
    
    # Compare
    compare_trial_balances(excel_df, platform_data)
    
    print("\n" + "="*60)
    print("ANALYSIS COMPLETE")
    print("="*60)

if __name__ == "__main__":
    main()