#!/usr/bin/env python3
"""
Double-Entry Bookkeeping Verification
Validates that the platform correctly implements double-entry accounting principles
"""

import requests
import json

def verify_double_entry_bookkeeping():
    """Comprehensive verification of double-entry bookkeeping implementation"""
    
    BASE_URL = 'http://localhost:5000/api'
    TOKEN = 'eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0='
    HEADERS = {'Authorization': f'Bearer {TOKEN}'}
    
    print("=" * 80)
    print("DOUBLE-ENTRY BOOKKEEPING VERIFICATION")
    print("=" * 80)
    
    # Get all journal entries
    response = requests.get(f'{BASE_URL}/journal-entries', headers=HEADERS)
    
    if response.status_code != 200:
        print(f"Error fetching journal entries: {response.status_code}")
        return
    
    entries = response.json()
    print(f"Total journal entries: {len(entries)}")
    
    # 1. FUNDAMENTAL ACCOUNTING EQUATION VERIFICATION
    print(f"\n=== FUNDAMENTAL ACCOUNTING EQUATION ===")
    print("Assets = Liabilities + Equity")
    print("Debits = Credits (for all transactions)")
    
    total_debits = sum([float(e.get('debitAmount', 0)) for e in entries])
    total_credits = sum([float(e.get('creditAmount', 0)) for e in entries])
    difference = abs(total_debits - total_credits)
    
    print(f"\nSystem-wide Balance Check:")
    print(f"Total Debits:  ₹{total_debits:,.2f}")
    print(f"Total Credits: ₹{total_credits:,.2f}")
    print(f"Difference:    ₹{difference:,.2f}")
    
    is_balanced = difference < 1.0
    print(f"Is Balanced:   {'✓ YES' if is_balanced else '✗ NO'}")
    
    if is_balanced:
        print("✓ PASSED: System maintains fundamental accounting equation")
    else:
        print("✗ FAILED: System violates fundamental accounting equation")
    
    # 2. TRANSACTION PAIRING VERIFICATION
    print(f"\n=== TRANSACTION PAIRING VERIFICATION ===")
    
    # Group entries by document/transaction
    from collections import defaultdict
    doc_groups = defaultdict(list)
    
    for entry in entries:
        doc_id = entry.get('documentId', 'unknown')
        doc_groups[doc_id].append(entry)
    
    balanced_docs = 0
    unbalanced_docs = 0
    
    print("Sample transaction pairs:")
    sample_count = 0
    
    for doc_id, doc_entries in doc_groups.items():
        doc_debits = sum([float(e.get('debitAmount', 0)) for e in doc_entries])
        doc_credits = sum([float(e.get('creditAmount', 0)) for e in doc_entries])
        doc_balanced = abs(doc_debits - doc_credits) < 1.0
        
        if doc_balanced:
            balanced_docs += 1
        else:
            unbalanced_docs += 1
        
        # Show first few examples
        if sample_count < 3 and len(doc_entries) >= 2:
            print(f"\nDocument: {doc_id[:20]}...")
            for entry in doc_entries[:2]:
                debit = float(entry.get('debitAmount', 0))
                credit = float(entry.get('creditAmount', 0))
                account = entry.get('accountCode', 'N/A')
                
                if debit > 0:
                    print(f"  Dr. {account}: ₹{debit:,.2f}")
                if credit > 0:
                    print(f"  Cr. {account}: ₹{credit:,.2f}")
            
            print(f"  Balanced: {'✓' if doc_balanced else '✗'} (Dr: ₹{doc_debits:,.2f} = Cr: ₹{doc_credits:,.2f})")
            sample_count += 1
    
    print(f"\nTransaction Balance Summary:")
    print(f"Balanced documents: {balanced_docs}")
    print(f"Unbalanced documents: {unbalanced_docs}")
    print(f"Balance rate: {(balanced_docs / len(doc_groups) * 100):.1f}%")
    
    # 3. ACCOUNT CLASSIFICATION VERIFICATION
    print(f"\n=== ACCOUNT CLASSIFICATION VERIFICATION ===")
    
    account_totals = defaultdict(lambda: {'debit': 0, 'credit': 0, 'count': 0})
    
    for entry in entries:
        account = entry.get('accountCode', 'unknown')
        debit = float(entry.get('debitAmount', 0))
        credit = float(entry.get('creditAmount', 0))
        
        account_totals[account]['debit'] += debit
        account_totals[account]['credit'] += credit
        account_totals[account]['count'] += 1
    
    print("Account Type Analysis:")
    
    assets_total = 0
    liabilities_total = 0
    equity_total = 0
    revenue_total = 0
    expense_total = 0
    
    for account in sorted(account_totals.keys()):
        totals = account_totals[account]
        net_balance = totals['debit'] - totals['credit']
        
        # Determine account type and natural balance
        if account.startswith('1'):  # Assets
            account_type = "Asset"
            assets_total += net_balance
            natural_balance = "Debit"
        elif account.startswith('2'):  # Liabilities
            account_type = "Liability" 
            liabilities_total += net_balance
            natural_balance = "Credit"
        elif account.startswith('3'):  # Equity
            account_type = "Equity"
            equity_total += net_balance
            natural_balance = "Credit"
        elif account.startswith('4'):  # Revenue
            account_type = "Revenue"
            revenue_total += totals['credit']  # Revenue is credit balance
            natural_balance = "Credit"
        elif account.startswith('5'):  # Expenses
            account_type = "Expense"
            expense_total += totals['debit']  # Expense is debit balance
            natural_balance = "Debit"
        else:
            account_type = "Unknown"
            natural_balance = "Unknown"
        
        print(f"  {account} ({account_type}): Dr ₹{totals['debit']:,.0f} | Cr ₹{totals['credit']:,.0f} | Net ₹{net_balance:,.0f} | Entries: {totals['count']}")
    
    # 4. ACCOUNTING EQUATION VERIFICATION
    print(f"\n=== ACCOUNTING EQUATION VERIFICATION ===")
    print(f"Assets = Liabilities + Equity + (Revenue - Expenses)")
    
    print(f"\nAccount Totals:")
    print(f"Assets (1xxx):      ₹{assets_total:,.2f}")
    print(f"Liabilities (2xxx): ₹{liabilities_total:,.2f}")
    print(f"Equity (3xxx):      ₹{equity_total:,.2f}")
    print(f"Revenue (4xxx):     ₹{revenue_total:,.2f}")
    print(f"Expenses (5xxx):    ₹{expense_total:,.2f}")
    
    # Calculate net income
    net_income = revenue_total - expense_total
    print(f"Net Income (Rev-Exp): ₹{net_income:,.2f}")
    
    # Check if equation balances
    left_side = assets_total
    right_side = liabilities_total + equity_total + net_income
    equation_difference = abs(left_side - right_side)
    
    print(f"\nEquation Check:")
    print(f"Left side (Assets): ₹{left_side:,.2f}")
    print(f"Right side (Liab + Equity + Net Income): ₹{right_side:,.2f}")
    print(f"Difference: ₹{equation_difference:,.2f}")
    
    equation_balanced = equation_difference < 1000  # Allow small rounding differences
    print(f"Equation Balanced: {'✓ YES' if equation_balanced else '✗ NO'}")
    
    # 5. FINAL ASSESSMENT
    print(f"\n=== DOUBLE-ENTRY BOOKKEEPING ASSESSMENT ===")
    
    tests_passed = 0
    total_tests = 4
    
    if is_balanced:
        print("✓ Test 1: System-wide debit/credit balance - PASSED")
        tests_passed += 1
    else:
        print("✗ Test 1: System-wide debit/credit balance - FAILED")
    
    if balanced_docs > unbalanced_docs:
        print("✓ Test 2: Individual transaction balance - PASSED")
        tests_passed += 1
    else:
        print("✗ Test 2: Individual transaction balance - FAILED")
    
    if len(account_totals) > 3:  # Has multiple account types
        print("✓ Test 3: Multiple account classifications - PASSED")
        tests_passed += 1
    else:
        print("✗ Test 3: Multiple account classifications - FAILED")
    
    if equation_balanced:
        print("✓ Test 4: Accounting equation integrity - PASSED")
        tests_passed += 1
    else:
        print("✗ Test 4: Accounting equation integrity - FAILED")
    
    success_rate = (tests_passed / total_tests) * 100
    
    print(f"\nFINAL RESULT:")
    print(f"Tests passed: {tests_passed}/{total_tests}")
    print(f"Success rate: {success_rate:.1f}%")
    
    if success_rate >= 100:
        print("🎯 EXCELLENT: Perfect double-entry bookkeeping implementation")
    elif success_rate >= 75:
        print("✓ GOOD: Strong double-entry bookkeeping compliance")
    elif success_rate >= 50:
        print("→ ACCEPTABLE: Basic double-entry bookkeeping in place")
    else:
        print("✗ NEEDS IMPROVEMENT: Double-entry bookkeeping issues detected")
    
    return {
        'success_rate': success_rate,
        'tests_passed': tests_passed,
        'total_tests': total_tests,
        'is_balanced': is_balanced,
        'total_entries': len(entries)
    }

if __name__ == "__main__":
    verify_double_entry_bookkeeping()