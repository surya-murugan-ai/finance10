#!/usr/bin/env python3

import requests
import json
from decimal import Decimal, ROUND_HALF_UP

def check_all_calculations():
    """Comprehensive check of all financial report calculations"""
    
    token = "eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0="
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("🔍 COMPREHENSIVE FINANCIAL REPORT CALCULATION CHECK")
    print("=" * 60)
    
    # 1. GET TRIAL BALANCE DATA
    try:
        tb_response = requests.post("http://localhost:5000/api/reports/trial-balance", headers=headers, json={"period": "2025-Q1"})
        trial_balance = tb_response.json()
        
        print(f"📊 TRIAL BALANCE:")
        print(f"   Total Debits: ₹{trial_balance['totalDebits']:,.2f}")
        print(f"   Total Credits: ₹{trial_balance['totalCredits']:,.2f}")
        print(f"   Balanced: {trial_balance['isBalanced']}")
        print(f"   Entries: {len(trial_balance['entries'])}")
        
        # Calculate totals by account type
        assets_tb = sum(entry['debitBalance'] - entry['creditBalance'] for entry in trial_balance['entries'] if entry['accountCode'].startswith('1'))
        liabilities_tb = sum(entry['creditBalance'] - entry['debitBalance'] for entry in trial_balance['entries'] if entry['accountCode'].startswith('2'))
        equity_tb = sum(entry['creditBalance'] - entry['debitBalance'] for entry in trial_balance['entries'] if entry['accountCode'].startswith('3'))
        revenue_tb = sum(entry['creditBalance'] - entry['debitBalance'] for entry in trial_balance['entries'] if entry['accountCode'].startswith('4'))
        expenses_tb = sum(entry['debitBalance'] - entry['creditBalance'] for entry in trial_balance['entries'] if entry['accountCode'].startswith('5'))
        
        print(f"   Assets (1xxx): ₹{assets_tb:,.2f}")
        print(f"   Liabilities (2xxx): ₹{liabilities_tb:,.2f}") 
        print(f"   Equity (3xxx): ₹{equity_tb:,.2f}")
        print(f"   Revenue (4xxx): ₹{revenue_tb:,.2f}")
        print(f"   Expenses (5xxx): ₹{expenses_tb:,.2f}")
        
    except Exception as e:
        print(f"❌ Trial Balance Error: {e}")
        return
    
    # 2. GET PROFIT & LOSS DATA
    try:
        pl_response = requests.post("http://localhost:5000/api/reports/profit-loss", headers=headers, json={"period": "2025-Q1"})
        profit_loss = pl_response.json()
        
        print(f"\n💰 PROFIT & LOSS:")
        print(f"   Total Revenue: ₹{profit_loss['totalRevenue']:,.2f}")
        print(f"   Total Expenses: ₹{profit_loss['totalExpenses']:,.2f}")
        print(f"   Net Income: ₹{profit_loss['netIncome']:,.2f}")
        print(f"   Revenue Accounts: {len(profit_loss['revenue'])}")
        print(f"   Expense Accounts: {len(profit_loss['expenses'])}")
        
        # Check P&L against Trial Balance
        print(f"\n🔍 P&L vs Trial Balance Check:")
        print(f"   Revenue TB: ₹{revenue_tb:,.2f} vs P&L: ₹{profit_loss['totalRevenue']:,.2f} - Match: {abs(revenue_tb - profit_loss['totalRevenue']) < 0.01}")
        print(f"   Expenses TB: ₹{expenses_tb:,.2f} vs P&L: ₹{profit_loss['totalExpenses']:,.2f} - Match: {abs(expenses_tb - profit_loss['totalExpenses']) < 0.01}")
        
    except Exception as e:
        print(f"❌ Profit & Loss Error: {e}")
        return
    
    # 3. GET BALANCE SHEET DATA
    try:
        bs_response = requests.post("http://localhost:5000/api/reports/balance-sheet", headers=headers, json={"period": "2025-Q1"})
        balance_sheet = bs_response.json()
        
        print(f"\n🏢 BALANCE SHEET:")
        print(f"   Total Assets: ₹{balance_sheet['totalAssets']:,.2f}")
        print(f"   Total Liabilities: ₹{balance_sheet['totalLiabilities']:,.2f}")
        print(f"   Total Equity: ₹{balance_sheet['totalEquity']:,.2f}")
        print(f"   Assets Accounts: {len(balance_sheet['assets'])}")
        print(f"   Liabilities Accounts: {len(balance_sheet['liabilities'])}")
        print(f"   Equity Accounts: {len(balance_sheet['equity'])}")
        
        # Balance Sheet Equation Check
        balance_check = balance_sheet['totalAssets'] - (balance_sheet['totalLiabilities'] + balance_sheet['totalEquity'])
        print(f"\n🔍 Balance Sheet Equation Check:")
        print(f"   Assets = Liabilities + Equity")
        print(f"   ₹{balance_sheet['totalAssets']:,.2f} = ₹{balance_sheet['totalLiabilities']:,.2f} + ₹{balance_sheet['totalEquity']:,.2f}")
        print(f"   Balance Difference: ₹{balance_check:,.2f}")
        print(f"   Balanced: {abs(balance_check) < 0.01}")
        
        # Check Balance Sheet against Trial Balance
        print(f"\n🔍 Balance Sheet vs Trial Balance Check:")
        print(f"   Assets TB: ₹{assets_tb:,.2f} vs BS: ₹{balance_sheet['totalAssets']:,.2f} - Match: {abs(assets_tb - balance_sheet['totalAssets']) < 0.01}")
        print(f"   Liabilities TB: ₹{liabilities_tb:,.2f} vs BS: ₹{balance_sheet['totalLiabilities']:,.2f} - Match: {abs(liabilities_tb - balance_sheet['totalLiabilities']) < 0.01}")
        print(f"   Equity TB: ₹{equity_tb:,.2f} vs BS: ₹{balance_sheet['totalEquity']:,.2f} - Match: {abs(equity_tb - balance_sheet['totalEquity']) < 0.01}")
        
    except Exception as e:
        print(f"❌ Balance Sheet Error: {e}")
        return
    
    # 4. GET CASH FLOW DATA
    try:
        cf_response = requests.post("http://localhost:5000/api/reports/cash-flow", headers=headers, json={"period": "2025-Q1"})
        cash_flow = cf_response.json()
        
        print(f"\n💵 CASH FLOW:")
        print(f"   Operating Activities: {len(cash_flow['operating'])}")
        print(f"   Investing Activities: {len(cash_flow['investing'])}")
        print(f"   Financing Activities: {len(cash_flow['financing'])}")
        print(f"   Net Cash Flow: ₹{cash_flow['netCashFlow']:,.2f}")
        
    except Exception as e:
        print(f"❌ Cash Flow Error: {e}")
        return
    
    # 5. IDENTIFY MAJOR ISSUES
    print(f"\n🚨 MAJOR CALCULATION ISSUES IDENTIFIED:")
    issues = []
    
    # Balance Sheet doesn't balance
    if abs(balance_check) > 0.01:
        issues.append(f"Balance Sheet Equation: Assets ≠ Liabilities + Equity (Difference: ₹{balance_check:,.2f})")
    
    # Zero equity issue
    if balance_sheet['totalEquity'] == 0:
        issues.append("Balance Sheet shows ₹0 equity - missing retained earnings/net income transfer")
    
    # P&L not matching TB
    if abs(revenue_tb - profit_loss['totalRevenue']) > 0.01:
        issues.append(f"Revenue mismatch: TB ₹{revenue_tb:,.2f} vs P&L ₹{profit_loss['totalRevenue']:,.2f}")
    
    if abs(expenses_tb - profit_loss['totalExpenses']) > 0.01:
        issues.append(f"Expense mismatch: TB ₹{expenses_tb:,.2f} vs P&L ₹{profit_loss['totalExpenses']:,.2f}")
    
    # Cash flow showing zero
    if cash_flow['netCashFlow'] == 0 and len(cash_flow['operating']) == 0:
        issues.append("Cash Flow Statement shows no activities - should include bank account movements")
    
    if issues:
        for i, issue in enumerate(issues, 1):
            print(f"   {i}. {issue}")
    else:
        print("   ✅ No major calculation issues detected!")
    
    return len(issues) == 0

if __name__ == "__main__":
    is_accurate = check_all_calculations()
    print(f"\n{'✅ ALL CALCULATIONS ACCURATE' if is_accurate else '❌ CALCULATION ISSUES FOUND'}")