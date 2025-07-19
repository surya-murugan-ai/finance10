#!/usr/bin/env python3

import requests
import json

def test_balance_sheet_fix():
    """Test the balance sheet retained earnings fix"""
    
    token = "eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0="
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("🔧 TESTING BALANCE SHEET CALCULATION FIXES")
    print("=" * 50)
    
    # Test Balance Sheet
    try:
        response = requests.post("http://localhost:5000/api/reports/balance-sheet", headers=headers, json={"period": "2025-Q1"})
        bs_data = response.json()
        
        print("🏢 BALANCE SHEET RESULTS:")
        print(f"   Assets: ₹{bs_data['totalAssets']:,.2f}")
        print(f"   Liabilities: ₹{bs_data['totalLiabilities']:,.2f}")
        print(f"   Equity: ₹{bs_data['totalEquity']:,.2f}")
        print(f"   Balanced: {bs_data['isBalanced']}")
        print(f"   Equity Accounts: {len(bs_data['equity'])}")
        
        if len(bs_data['equity']) > 0:
            print("   Equity Details:")
            for eq in bs_data['equity']:
                print(f"     - {eq['accountName']}: ₹{eq['amount']:,.2f}")
        
        # Calculate imbalance
        imbalance = bs_data['totalAssets'] - (bs_data['totalLiabilities'] + bs_data['totalEquity'])
        print(f"   Imbalance: ₹{imbalance:,.2f}")
        
        if abs(imbalance) > 0.01:
            print("   ❌ BALANCE SHEET STILL NOT BALANCED!")
            print(f"   Missing retained earnings of ₹{imbalance:,.2f}")
            
            # Manual fix calculation
            print("\n🔧 MANUAL RETAINED EARNINGS CALCULATION:")
            p_l_response = requests.post("http://localhost:5000/api/reports/profit-loss", headers=headers, json={"period": "2025-Q1"})
            p_l_data = p_l_response.json()
            net_income = p_l_data['totalRevenue'] - p_l_data['totalExpenses']
            
            print(f"   P&L Net Income: ₹{net_income:,.2f}")
            print(f"   Should be added as Retained Earnings to Equity")
            
            # Show what balance sheet should look like
            corrected_equity = bs_data['totalEquity'] + imbalance
            print(f"\n✅ CORRECTED BALANCE SHEET:")
            print(f"   Assets: ₹{bs_data['totalAssets']:,.2f}")
            print(f"   Liabilities: ₹{bs_data['totalLiabilities']:,.2f}")
            print(f"   Equity (with retained earnings): ₹{corrected_equity:,.2f}")
            print(f"   Balanced: {abs(bs_data['totalAssets'] - (bs_data['totalLiabilities'] + corrected_equity)) < 0.01}")
        else:
            print("   ✅ BALANCE SHEET IS BALANCED!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_balance_sheet_fix()