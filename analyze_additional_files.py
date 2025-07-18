#!/usr/bin/env python3
"""
Analyze additional Excel files in attached_assets to extract missing financial data
Target: ₹14,57,87,998.21
Current: ₹9,50,99,615.31
Gap: ₹5,06,88,382.90
"""

import pandas as pd
import os
import sys
from decimal import Decimal

def analyze_excel_file(file_path):
    """Extract financial data from Excel file"""
    try:
        print(f"\n{'='*50}")
        print(f"ANALYZING: {os.path.basename(file_path)}")
        print(f"{'='*50}")
        
        # Read all sheets
        excel_file = pd.ExcelFile(file_path)
        total_amounts = []
        
        for sheet_name in excel_file.sheet_names:
            print(f"\nSheet: {sheet_name}")
            try:
                df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
                print(f"Shape: {df.shape}")
                
                # Look for numerical data
                numeric_values = []
                for col in df.columns:
                    for idx, cell in df[col].items():
                        if pd.notna(cell):
                            # Try to convert to number
                            try:
                                if isinstance(cell, str):
                                    # Clean the string
                                    cleaned = cell.replace(',', '').replace('₹', '').replace('Rs', '').replace('INR', '').strip()
                                    if cleaned.replace('.', '').replace('-', '').isdigit():
                                        value = float(cleaned)
                                        if value > 1000:  # Only significant amounts
                                            numeric_values.append(value)
                                            print(f"Row {idx+1}, Col {col+1}: {cell} -> {value:,.2f}")
                                elif isinstance(cell, (int, float)):
                                    if cell > 1000:
                                        numeric_values.append(float(cell))
                                        print(f"Row {idx+1}, Col {col+1}: {cell:,.2f}")
                            except:
                                pass
                
                if numeric_values:
                    sheet_total = sum(numeric_values)
                    print(f"Sheet Total: ₹{sheet_total:,.2f}")
                    total_amounts.extend(numeric_values)
                    
            except Exception as e:
                print(f"Error reading sheet {sheet_name}: {e}")
        
        if total_amounts:
            file_total = sum(total_amounts)
            print(f"\nFILE TOTAL: ₹{file_total:,.2f}")
            print(f"Unique values: {len(set(total_amounts))}")
            return file_total, total_amounts
        else:
            print("No significant amounts found")
            return 0, []
            
    except Exception as e:
        print(f"Error analyzing {file_path}: {e}")
        return 0, []

def main():
    """Main analysis function"""
    print("ANALYZING ADDITIONAL EXCEL FILES FOR MISSING FINANCIAL DATA")
    print("=" * 60)
    
    # Target and current amounts
    target_amount = 145787998.21
    current_amount = 95099615.31
    gap = target_amount - current_amount
    
    print(f"Target Amount: ₹{target_amount:,.2f}")
    print(f"Current Amount: ₹{current_amount:,.2f}")
    print(f"Gap to Fill: ₹{gap:,.2f}")
    
    # Files to analyze
    files_to_analyze = [
        "attached_assets/DB Bank Apr-Jun HO_1752770758283.xlsx",
        "attached_assets/Purchase Reg Apr-Jun Chennai_1752770758284.xlsx", 
        "attached_assets/Sales Reg Apr-Jun Chennai_1752770758282.xlsx",
        "attached_assets/TrialBal Chennai_1752771337601.xlsx",
        "attached_assets/TrialBal Chennai_1752771856984.xlsx"
    ]
    
    total_additional = 0
    all_amounts = []
    
    for file_path in files_to_analyze:
        if os.path.exists(file_path):
            file_total, amounts = analyze_excel_file(file_path)
            total_additional += file_total
            all_amounts.extend(amounts)
        else:
            print(f"File not found: {file_path}")
    
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Total Additional Amount Found: ₹{total_additional:,.2f}")
    print(f"New Platform Total Would Be: ₹{current_amount + total_additional:,.2f}")
    print(f"Remaining Gap: ₹{target_amount - (current_amount + total_additional):,.2f}")
    print(f"Progress: {((current_amount + total_additional) / target_amount) * 100:.1f}%")
    
    if all_amounts:
        print(f"\nTop 10 Largest Amounts Found:")
        sorted_amounts = sorted(all_amounts, reverse=True)
        for i, amount in enumerate(sorted_amounts[:10]):
            print(f"{i+1}. ₹{amount:,.2f}")

if __name__ == "__main__":
    main()