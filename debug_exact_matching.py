#!/usr/bin/env python3
"""
Debug exactly what's in the platform vs what should be there
"""

import requests
import json
import pandas as pd
import os

# Get current platform data
BASE_URL = "http://localhost:5000"
JWT_TOKEN = "eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0="

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

def get_current_platform_data():
    """Get what the platform is currently showing"""
    try:
        response = requests.post(f"{BASE_URL}/api/reports/trial-balance", 
                               headers=headers, 
                               json={"period": "Q1_2025"})
        
        if response.status_code == 200:
            data = response.json()
            print("CURRENT PLATFORM DATA:")
            print(f"Total Debits: ₹{data.get('totalDebits', 0):,.2f}")
            print(f"Total Credits: ₹{data.get('totalCredits', 0):,.2f}")
            print(f"Number of entries: {len(data.get('entries', []))}")
            print(f"Is Balanced: {data.get('isBalanced', False)}")
            
            # Show top 10 entries
            entries = data.get('entries', [])
            print(f"\nTop 10 Entries:")
            for i, entry in enumerate(entries[:10]):
                print(f"{i+1}. {entry.get('accountName', 'N/A')} - Debit: ₹{entry.get('debitBalance', 0):,.2f}")
            
            return data
        else:
            print(f"Error getting platform data: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def analyze_expected_vs_actual():
    """Compare expected vs actual"""
    print("\n" + "="*60)
    print("EXPECTED VS ACTUAL ANALYSIS")
    print("="*60)
    
    # Target amount
    target = 145787998.21
    print(f"Target Amount: ₹{target:,.2f}")
    
    # Get current platform data
    platform_data = get_current_platform_data()
    if platform_data:
        current_total = platform_data.get('totalDebits', 0)
        print(f"Current Platform Total: ₹{current_total:,.2f}")
        
        if current_total >= target:
            print("✅ TARGET ACHIEVED!")
            print(f"Exceeded by: ₹{current_total - target:,.2f}")
            print(f"Percentage: {(current_total / target) * 100:.1f}%")
        else:
            print("❌ TARGET NOT REACHED")
            print(f"Shortfall: ₹{target - current_total:,.2f}")
            print(f"Percentage: {(current_total / target) * 100:.1f}%")
    
    # Check if files contain the expected target
    print(f"\nChecking if files contain target amount...")
    files_to_check = [
        "attached_assets/TrialBal Chennai_1752771337601.xlsx",
        "attached_assets/TrialBal Chennai_1752771856984.xlsx"
    ]
    
    for file_path in files_to_check:
        if os.path.exists(file_path):
            try:
                df = pd.read_excel(file_path, sheet_name=None)
                found_target = False
                for sheet_name, sheet_data in df.items():
                    # Check if any cell contains the target amount
                    for col in sheet_data.columns:
                        for val in sheet_data[col].dropna():
                            if isinstance(val, (int, float)) and abs(val - target) < 1:
                                print(f"✅ Found target amount in {file_path}, sheet {sheet_name}")
                                found_target = True
                                break
                            elif isinstance(val, str) and str(target) in val.replace(',', ''):
                                print(f"✅ Found target amount as string in {file_path}, sheet {sheet_name}")
                                found_target = True
                                break
                        if found_target:
                            break
                    if found_target:
                        break
                
                if not found_target:
                    print(f"❌ Target amount NOT found in {file_path}")
                    
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
        else:
            print(f"File not found: {file_path}")

if __name__ == "__main__":
    analyze_expected_vs_actual()