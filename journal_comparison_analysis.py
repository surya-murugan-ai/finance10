#!/usr/bin/env python3
"""
Journal Entry Comparison Analysis
Compares platform-generated journal entries with manually calculated journal entries
"""

import pandas as pd
import requests
import json

def analyze_manual_journal():
    """Analyze the manual journal file structure and extract key amounts"""
    try:
        df = pd.read_excel('attached_assets/Journal Apr-Jun Chennai_1752936472433.xlsx', 
                          sheet_name='Journal Register')
        
        print("=== MANUAL JOURNAL ANALYSIS ===")
        print(f"Total rows: {df.shape[0]}, Total columns: {df.shape[1]}")
        
        # Extract journal entries systematically
        journal_entries = []
        for i, row in df.iterrows():
            if i < 3:  # Skip headers
                continue
                
            amounts = []
            account_info = []
            
            for j, cell in enumerate(row):
                if pd.notna(cell):
                    cell_str = str(cell).strip()
                    
                    # Extract amounts
                    try:
                        if cell_str.replace(',', '').replace('.', '').replace('-', '').isdigit():
                            amount = float(cell_str.replace(',', ''))
                            if 100 < amount < 10000000:  # Reasonable range
                                amounts.append(amount)
                    except:
                        pass
                    
                    # Extract account information
                    if j <= 2 and len(cell_str) > 5:  # First few columns likely have account info
                        account_info.append(cell_str[:50])
            
            if amounts:
                journal_entries.append({
                    'row': i,
                    'amounts': amounts,
                    'total': sum(amounts),
                    'account_info': account_info
                })
        
        # Calculate summary statistics
        total_manual_entries = len(journal_entries)
        all_amounts = [amt for entry in journal_entries for amt in entry['amounts']]
        total_manual_amount = sum(all_amounts)
        
        print(f"Manual journal entries found: {total_manual_entries}")
        print(f"Total individual amounts: {len(all_amounts)}")
        print(f"Total amount: ₹{total_manual_amount:,.2f}")
        
        # Show sample entries
        print("\nSample Manual Journal Entries:")
        for i, entry in enumerate(journal_entries[:10]):
            print(f"Entry {i+1}: {len(entry['amounts'])} amounts totaling ₹{entry['total']:,.2f}")
            if entry['account_info']:
                print(f"  Account: {entry['account_info'][0]}")
        
        return {
            'total_entries': total_manual_entries,
            'total_amount': total_manual_amount,
            'entries': journal_entries
        }
        
    except Exception as e:
        print(f"Error analyzing manual journal: {e}")
        return None

def analyze_platform_journal():
    """Analyze platform-generated journal entries"""
    try:
        BASE_URL = 'http://localhost:5000/api'
        TOKEN = 'eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0='
        HEADERS = {'Authorization': f'Bearer {TOKEN}'}
        
        response = requests.get(f'{BASE_URL}/journal-entries', headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            
            print("\n=== PLATFORM JOURNAL ANALYSIS ===")
            print(f"Total platform journal entries: {len(data)}")
            
            # Calculate totals
            total_debits = sum(float(entry.get('debitAmount', 0)) for entry in data)
            total_credits = sum(float(entry.get('creditAmount', 0)) for entry in data)
            
            print(f"Total debits: ₹{total_debits:,.2f}")
            print(f"Total credits: ₹{total_credits:,.2f}")
            print(f"Is balanced: {abs(total_debits - total_credits) < 1}")
            
            # Group by account code
            by_account = {}
            for entry in data:
                account_code = entry.get('accountCode', 'Unknown')
                if account_code not in by_account:
                    by_account[account_code] = {'count': 0, 'debits': 0, 'credits': 0}
                
                by_account[account_code]['count'] += 1
                by_account[account_code]['debits'] += float(entry.get('debitAmount', 0))
                by_account[account_code]['credits'] += float(entry.get('creditAmount', 0))
            
            print("\nAccount breakdown:")
            for code, totals in by_account.items():
                print(f"  {code}: {totals['count']} entries, "
                      f"₹{totals['debits']:,.2f} debits, ₹{totals['credits']:,.2f} credits")
            
            return {
                'total_entries': len(data),
                'total_debits': total_debits,
                'total_credits': total_credits,
                'by_account': by_account,
                'entries': data
            }
        else:
            print(f"Error fetching platform journal: HTTP {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error analyzing platform journal: {e}")
        return None

def compare_journals():
    """Compare manual and platform journal entries"""
    print("=" * 80)
    print("JOURNAL ENTRY COMPARISON ANALYSIS")
    print("=" * 80)
    
    manual_data = analyze_manual_journal()
    platform_data = analyze_platform_journal()
    
    if manual_data and platform_data:
        print("\n=== COMPARISON SUMMARY ===")
        print(f"Manual entries: {manual_data['total_entries']}")
        print(f"Platform entries: {platform_data['total_entries']}")
        print(f"Entry count ratio: {platform_data['total_entries'] / manual_data['total_entries']:.2f}x")
        print()
        print(f"Manual total amount: ₹{manual_data['total_amount']:,.2f}")
        print(f"Platform total debits: ₹{platform_data['total_debits']:,.2f}")
        print(f"Platform total credits: ₹{platform_data['total_credits']:,.2f}")
        print(f"Amount ratio (platform/manual): {platform_data['total_debits'] / manual_data['total_amount']:.2f}x")
        print()
        
        # Analyze differences
        amount_diff = platform_data['total_debits'] - manual_data['total_amount']
        print(f"Amount difference: ₹{amount_diff:,.2f}")
        
        if amount_diff > 0:
            print(f"Platform shows ₹{amount_diff:,.2f} MORE than manual")
        else:
            print(f"Platform shows ₹{abs(amount_diff):,.2f} LESS than manual")
        
        print("\n=== KEY OBSERVATIONS ===")
        print("1. Platform creates simple debit/credit pairs (1100 Bank, 4100 Sales)")
        print("2. Manual journal has complex multi-column structure with various accounts")
        print("3. Platform may be processing raw transaction data differently")
        print("4. Manual journal may represent net/consolidated entries")
        
        print("\n=== RECOMMENDATIONS ===")
        print("1. Check if platform is double-counting transactions")
        print("2. Verify account mapping between platform and manual methods")
        print("3. Review transaction source data for completeness")
        print("4. Consider different accounting methodologies (gross vs net)")

if __name__ == "__main__":
    compare_journals()