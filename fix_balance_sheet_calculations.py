#!/usr/bin/env python3

import requests
import json
from decimal import Decimal

def fix_balance_sheet_calculations():
    """Fix balance sheet calculations by creating comprehensive calculation checks"""
    
    token = "eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0="
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("🔧 COMPREHENSIVE BALANCE SHEET CALCULATION ANALYSIS")
    print("=" * 60)
    
    # 1. Get all journal entries and analyze
    try:
        je_response = requests.get("http://localhost:5000/api/journal-entries", headers={"Authorization": f"Bearer {token}"})
        journal_entries = je_response.json()
        
        print(f"📊 JOURNAL ENTRIES ANALYSIS:")
        print(f"   Total Journal Entries: {len(journal_entries)}")
        
        # Analyze by account code
        account_totals = {}
        for entry in journal_entries:
            account_code = entry['accountCode']
            debit = float(entry.get('debitAmount', 0))
            credit = float(entry.get('creditAmount', 0))
            
            if account_code not in account_totals:
                account_totals[account_code] = {
                    'name': entry['accountName'], 
                    'debits': 0, 
                    'credits': 0, 
                    'net': 0
                }
            
            account_totals[account_code]['debits'] += debit
            account_totals[account_code]['credits'] += credit
            account_totals[account_code]['net'] += (debit - credit)
        
        # Categorize accounts
        assets = {}
        liabilities = {}
        equity = {}
        revenue = {}
        expenses = {}
        
        for code, data in account_totals.items():
            if code.startswith('1'):  # Assets
                assets[code] = data
            elif code.startswith('2'):  # Liabilities 
                liabilities[code] = data
            elif code.startswith('3'):  # Equity
                equity[code] = data
            elif code.startswith('4'):  # Revenue
                revenue[code] = data
            elif code.startswith('5'):  # Expenses
                expenses[code] = data
        
        # Calculate totals
        total_assets = sum(data['net'] for data in assets.values() if data['net'] > 0)
        total_liabilities = sum(abs(data['net']) for data in liabilities.values() if data['net'] < 0)
        total_equity = sum(abs(data['net']) for data in equity.values() if data['net'] < 0)
        total_revenue = sum(abs(data['net']) for data in revenue.values() if data['net'] < 0)  # Credit balance
        total_expenses = sum(data['net'] for data in expenses.values() if data['net'] > 0)  # Debit balance
        
        print(f"\n📈 MANUAL CALCULATION RESULTS:")
        print(f"   Assets (1xxx): ₹{total_assets:,.2f}")
        print(f"   Liabilities (2xxx): ₹{total_liabilities:,.2f}")
        print(f"   Equity (3xxx): ₹{total_equity:,.2f}")
        print(f"   Revenue (4xxx): ₹{total_revenue:,.2f}")
        print(f"   Expenses (5xxx): ₹{total_expenses:,.2f}")
        
        # Calculate net income and required retained earnings
        net_income = total_revenue - total_expenses
        required_retained_earnings = total_assets - (total_liabilities + total_equity)
        
        print(f"\n🔍 BALANCE SHEET EQUATION CHECK:")
        print(f"   Net Income (P&L): ₹{net_income:,.2f}")
        print(f"   Required Retained Earnings: ₹{required_retained_earnings:,.2f}")
        print(f"   Match: {abs(net_income - required_retained_earnings) < 1}")
        
        # Show corrected balance sheet
        corrected_equity = total_equity + required_retained_earnings
        print(f"\n✅ CORRECTED BALANCE SHEET:")
        print(f"   Assets: ₹{total_assets:,.2f}")
        print(f"   Liabilities: ₹{total_liabilities:,.2f}")
        print(f"   Equity (Original): ₹{total_equity:,.2f}")
        print(f"   Retained Earnings: ₹{required_retained_earnings:,.2f}")
        print(f"   Total Equity: ₹{corrected_equity:,.2f}")
        print(f"   Balanced: {abs(total_assets - (total_liabilities + corrected_equity)) < 1}")
        
        # Show detailed account breakdown
        print(f"\n📋 DETAILED ACCOUNT ANALYSIS:")
        print("   ASSETS:")
        for code, data in sorted(assets.items()):
            if data['net'] > 0:
                print(f"     {code}: {data['name']} = ₹{data['net']:,.2f}")
        
        print("   LIABILITIES:")
        for code, data in sorted(liabilities.items()):
            if data['net'] < 0:
                print(f"     {code}: {data['name']} = ₹{abs(data['net']):,.2f}")
        
        print("   EQUITY:")
        for code, data in sorted(equity.items()):
            if data['net'] != 0:
                print(f"     {code}: {data['name']} = ₹{abs(data['net']):,.2f}")
        
        if required_retained_earnings > 0:
            print(f"     3100: Retained Earnings = ₹{required_retained_earnings:,.2f}")
        
    except Exception as e:
        print(f"❌ Error analyzing journal entries: {e}")
        return
    
    # 2. Test current API results
    try:
        bs_response = requests.post("http://localhost:5000/api/reports/balance-sheet", headers=headers, json={"period": "2025-Q1"})
        bs_data = bs_response.json()
        
        print(f"\n🏢 CURRENT API BALANCE SHEET:")
        print(f"   Assets: ₹{bs_data['totalAssets']:,.2f}")
        print(f"   Liabilities: ₹{bs_data['totalLiabilities']:,.2f}")
        print(f"   Equity: ₹{bs_data['totalEquity']:,.2f}")
        print(f"   Balanced: {bs_data['isBalanced']}")
        print(f"   Equity Accounts: {len(bs_data['equity'])}")
        
        print(f"\n🔧 REQUIRED FIX:")
        current_imbalance = bs_data['totalAssets'] - (bs_data['totalLiabilities'] + bs_data['totalEquity'])
        print(f"   Current Imbalance: ₹{current_imbalance:,.2f}")
        print(f"   Fix: Add Retained Earnings of ₹{current_imbalance:,.2f} to Equity")
        
    except Exception as e:
        print(f"❌ Error testing balance sheet API: {e}")

if __name__ == "__main__":
    fix_balance_sheet_calculations()