#!/usr/bin/env python3
"""
Manual vs Platform Calculation Comparison
Creates a detailed analysis to align platform calculations with manual methodology
"""

import pandas as pd
import requests
import json

def analyze_manual_methodology():
    """Deep analysis of manual journal structure to understand the accounting methodology"""
    
    df = pd.read_excel('attached_assets/Journal Apr-Jun Chennai_1752936472433.xlsx', 
                      sheet_name='Journal Register')
    
    print("=== MANUAL METHODOLOGY ANALYSIS ===")
    
    # Extract detailed journal structure
    detailed_entries = []
    current_entry = None
    
    for i, row in df.iterrows():
        if i < 3:  # Skip headers
            continue
            
        row_data = {}
        amounts = []
        account_names = []
        
        # Extract all non-null values from the row
        for j, cell in enumerate(row):
            if pd.notna(cell):
                cell_str = str(cell).strip()
                
                # Identify amounts
                try:
                    if cell_str.replace(',', '').replace('.', '').replace('-', '').isdigit():
                        amount = float(cell_str.replace(',', ''))
                        if amount > 100:  # Filter small amounts
                            amounts.append({'column': j, 'amount': amount})
                except:
                    pass
                
                # Identify account names/descriptions
                if j <= 5 and len(cell_str) > 5 and any(c.isalpha() for c in cell_str):
                    if 'date' not in cell_str.lower() and cell_str != 'Journal':
                        account_names.append({'column': j, 'name': cell_str})
        
        if amounts:  # If this row has amounts, it's a journal entry
            entry = {
                'row': i,
                'amounts': amounts,
                'accounts': account_names,
                'total_amount': sum([a['amount'] for a in amounts]),
                'amount_count': len(amounts)
            }
            detailed_entries.append(entry)
    
    print(f"Found {len(detailed_entries)} detailed journal entries")
    
    # Analyze patterns
    amount_patterns = {}
    for entry in detailed_entries:
        pattern = f"{entry['amount_count']}_amounts"
        if pattern not in amount_patterns:
            amount_patterns[pattern] = []
        amount_patterns[pattern].append(entry)
    
    print("\nAmount patterns in manual journal:")
    for pattern, entries in amount_patterns.items():
        print(f"  {pattern}: {len(entries)} entries")
        if len(entries) <= 3:  # Show examples for small groups
            for entry in entries:
                amounts_str = ", ".join([f"₹{a['amount']:,.0f}" for a in entry['amounts']])
                print(f"    Row {entry['row']}: {amounts_str}")
    
    # Look for balanced entries (debit = credit)
    balanced_entries = []
    for entry in detailed_entries:
        if entry['amount_count'] == 2:
            amounts = [a['amount'] for a in entry['amounts']]
            if amounts[0] == amounts[1]:  # Balanced entry
                balanced_entries.append(entry)
    
    print(f"\nBalanced entries (2 equal amounts): {len(balanced_entries)}")
    
    # Calculate totals using different methods
    total_all_amounts = sum([entry['total_amount'] for entry in detailed_entries])
    total_balanced_only = sum([entry['amounts'][0]['amount'] * 2 for entry in balanced_entries])
    
    print(f"\nTotal calculation methods:")
    print(f"  All amounts sum: ₹{total_all_amounts:,.2f}")
    print(f"  Balanced entries only: ₹{total_balanced_only:,.2f}")
    
    return {
        'entries': detailed_entries,
        'balanced_entries': balanced_entries,
        'total_all': total_all_amounts,
        'total_balanced': total_balanced_only,
        'patterns': amount_patterns
    }

def create_aligned_journal_entries():
    """Create journal entries that align with manual methodology"""
    
    # Get standardized transactions
    BASE_URL = 'http://localhost:5000/api'
    TOKEN = 'eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0='
    HEADERS = {'Authorization': f'Bearer {TOKEN}'}
    
    response = requests.get(f'{BASE_URL}/standardized-transactions', headers=HEADERS)
    
    if response.status_code == 200:
        result = response.json()
        transactions = result.get('transactions', [])
        
        print(f"\n=== PLATFORM TRANSACTION ANALYSIS ===")
        print(f"Total standardized transactions: {len(transactions)}")
        
        # Group transactions by type and company
        by_type = {}
        by_company = {}
        
        for trans in transactions:
            trans_type = trans.get('voucherType', 'Unknown')
            company = trans.get('company', 'Unknown')
            amount = float(trans.get('netAmount', 0))
            
            # Group by type
            if trans_type not in by_type:
                by_type[trans_type] = {'count': 0, 'total': 0, 'transactions': []}
            by_type[trans_type]['count'] += 1
            by_type[trans_type]['total'] += amount
            by_type[trans_type]['transactions'].append(trans)
            
            # Group by company
            if company not in by_company:
                by_company[company] = {'count': 0, 'total': 0}
            by_company[company]['count'] += 1
            by_company[company]['total'] += amount
        
        print("\nTransaction types:")
        for trans_type, data in by_type.items():
            print(f"  {trans_type}: {data['count']} transactions, ₹{data['total']:,.2f}")
        
        print(f"\nTop 10 companies by transaction value:")
        sorted_companies = sorted(by_company.items(), key=lambda x: x[1]['total'], reverse=True)
        for company, data in sorted_companies[:10]:
            print(f"  {company}: {data['count']} transactions, ₹{data['total']:,.2f}")
        
        # Create consolidated journal entries (similar to manual approach)
        consolidated_entries = []
        
        # Consolidate by transaction type
        for trans_type, data in by_type.items():
            if data['total'] > 1000:  # Only include significant amounts
                # Create a single consolidated entry for each transaction type
                if trans_type in ['Sales', 'Receipt']:
                    # Sales: Debit Bank, Credit Sales Revenue
                    consolidated_entries.append({
                        'description': f'Consolidated {trans_type} - {data["count"]} transactions',
                        'debit_account': '1100',
                        'debit_amount': data['total'],
                        'credit_account': '4100',
                        'credit_amount': data['total'],
                        'transaction_count': data['count']
                    })
                elif trans_type in ['Purchase', 'Payment']:
                    # Purchase: Debit Purchase Expense, Credit Bank
                    consolidated_entries.append({
                        'description': f'Consolidated {trans_type} - {data["count"]} transactions',
                        'debit_account': '5100',
                        'debit_amount': data['total'],
                        'credit_account': '1100',
                        'credit_amount': data['total'],
                        'transaction_count': data['count']
                    })
        
        total_consolidated = sum([entry['debit_amount'] for entry in consolidated_entries])
        
        print(f"\n=== CONSOLIDATED APPROACH ===")
        print(f"Consolidated entries created: {len(consolidated_entries)}")
        print(f"Total consolidated amount: ₹{total_consolidated:,.2f}")
        
        for entry in consolidated_entries:
            print(f"  {entry['description']}")
            print(f"    Debit {entry['debit_account']}: ₹{entry['debit_amount']:,.2f}")
            print(f"    Credit {entry['credit_account']}: ₹{entry['credit_amount']:,.2f}")
        
        return {
            'transactions': transactions,
            'by_type': by_type,
            'consolidated_entries': consolidated_entries,
            'total_consolidated': total_consolidated
        }
    
    else:
        print(f"Error fetching transactions: HTTP {response.status_code}")
        return None

def compare_methodologies():
    """Compare manual vs platform methodologies and suggest alignment"""
    
    print("=" * 80)
    print("METHODOLOGY COMPARISON AND ALIGNMENT")
    print("=" * 80)
    
    manual_data = analyze_manual_methodology()
    platform_data = create_aligned_journal_entries()
    
    if manual_data and platform_data:
        print(f"\n=== COMPARISON RESULTS ===")
        print(f"Manual total (all amounts): ₹{manual_data['total_all']:,.2f}")
        print(f"Manual total (balanced only): ₹{manual_data['total_balanced']:,.2f}")
        print(f"Platform total (current): ₹{platform_data['total_consolidated']:,.2f}")
        
        # Calculate differences
        diff_all = platform_data['total_consolidated'] - manual_data['total_all']
        diff_balanced = platform_data['total_consolidated'] - manual_data['total_balanced']
        
        print(f"\nDifferences:")
        print(f"  Platform vs Manual (all): ₹{diff_all:,.2f}")
        print(f"  Platform vs Manual (balanced): ₹{diff_balanced:,.2f}")
        
        print(f"\n=== ALIGNMENT RECOMMENDATIONS ===")
        print("1. Use consolidated approach similar to manual methodology")
        print("2. Group transactions by type rather than creating individual pairs")
        print("3. Focus on net amounts rather than gross transaction processing")
        print("4. Align with manual account structure and classification")
        
        # Suggest specific adjustments
        if abs(diff_balanced) < abs(diff_all):
            print(f"\nRECOMMENDATION: Use balanced-entry approach")
            print(f"This would reduce discrepancy from ₹{abs(diff_all):,.2f} to ₹{abs(diff_balanced):,.2f}")
        
        return {
            'manual': manual_data,
            'platform': platform_data,
            'recommendations': 'Use consolidated approach with balanced entries'
        }

if __name__ == "__main__":
    compare_methodologies()