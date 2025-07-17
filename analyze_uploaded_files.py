#!/usr/bin/env python3
"""
Analyze uploaded Excel files to understand their structure and content
"""

import pandas as pd
import os

def analyze_excel_file(file_path):
    """Analyze an Excel file and return structure information"""
    try:
        print(f"\n{'='*60}")
        print(f"Analyzing: {file_path}")
        print(f"{'='*60}")
        
        # Read the Excel file
        df = pd.read_excel(file_path)
        
        print(f"Shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        
        # Display first few rows
        print("\nFirst 5 rows:")
        print(df.head())
        
        # Display data types
        print("\nData types:")
        print(df.dtypes)
        
        # Check for missing values
        print("\nMissing values:")
        print(df.isnull().sum())
        
        # Display basic statistics for numeric columns
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 0:
            print("\nNumeric column statistics:")
            print(df[numeric_cols].describe())
        
        return df
        
    except Exception as e:
        print(f"Error analyzing {file_path}: {str(e)}")
        return None

def main():
    files_to_analyze = [
        "attached_assets/Sales Reg Apr-Jun Chennai_1752770758282.xlsx",
        "attached_assets/DB Bank Apr-Jun HO_1752770758283.xlsx", 
        "attached_assets/Purchase Reg Apr-Jun Chennai_1752770758284.xlsx"
    ]
    
    for file_path in files_to_analyze:
        if os.path.exists(file_path):
            analyze_excel_file(file_path)
        else:
            print(f"File not found: {file_path}")

if __name__ == "__main__":
    main()