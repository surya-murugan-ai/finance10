#!/usr/bin/env python3
"""
Analyze journal entry discrepancy - Quest Agrovet Services
Compare platform entries with manual journal entries
"""

import requests
import pandas as pd
import json

def analyze_quest_agrovet_discrepancy():
    """Analyze if Quest Agrovet Services appears in manual vs platform journals"""
    
    BASE_URL = 'http://localhost:5000/api'
    TOKEN = 'eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0='
    HEADERS = {'Authorization': f'Bearer {TOKEN}'}
    
    print("=" * 80)
    print("QUEST AGROVET SERVICES JOURNAL ENTRY ANALYSIS")
    print("=" * 80)
    
    # 1. Get platform journal entries
    print("1. Analyzing platform journal entries...")
    response = requests.get(f'{BASE_URL}/journal-entries', headers=HEADERS)
    
    if response.status_code != 200:
        print(f"Error fetching platform entries: {response.status_code}")
        return
    
    platform_entries = response.json()
    print(f"Total platform entries: {len(platform_entries)}")
    
    # Search for Quest Agrovet in platform entries
    quest_platform_entries = []
    for entry in platform_entries:
        text_fields = [
            entry.get('description', '').lower(),
            entry.get('narration', '').lower(), 
            entry.get('entity', '').lower(),
            entry.get('accountName', '').lower()
        ]
        
        if any('quest' in field or 'agrovet' in field for field in text_fields):
            quest_platform_entries.append(entry)
    
    print(f"Platform entries with Quest Agrovet: {len(quest_platform_entries)}")
    
    if quest_platform_entries:
        print("\\nQuest Agrovet entries in platform:")
        for entry in quest_platform_entries:
            debit = float(entry.get('debitAmount', 0))
            credit = float(entry.get('creditAmount', 0))
            account = entry.get('accountCode', 'N/A')
            desc = entry.get('description', 'N/A')
            date = entry.get('date', '')[:10] if entry.get('date') else 'N/A'
            
            print(f"  {date} | {account} | Dr: ₹{debit:,.0f} | Cr: ₹{credit:,.0f} | {desc}")
    
    # 2. Try to read manual journal file
    print(f"\\n2. Attempting to read manual journal file...")
    
    journal_files = [
        'attached_assets/Journal Apr-Jun Chennai_1752936472433.xlsx',
        'attached_assets/Journal Apr-Jun Chennai_1752937917586.xlsx'
    ]
    
    manual_quest_entries = []
    manual_total_entries = 0
    
    for file_path in journal_files:
        try:
            print(f"\\nTrying to read: {file_path}")
            df = pd.read_excel(file_path)
            manual_total_entries = len(df)
            print(f"Manual journal entries in {file_path}: {len(df)}")
            
            # Search for Quest Agrovet in manual entries
            quest_mask = df.astype(str).apply(lambda x: x.str.contains('quest|agrovet', case=False, na=False)).any(axis=1)
            quest_manual = df[quest_mask]
            
            if len(quest_manual) > 0:
                manual_quest_entries.extend(quest_manual.to_dict('records'))
                print(f"Found {len(quest_manual)} Quest Agrovet entries in manual journal")
            else:
                print("No Quest Agrovet entries found in this manual journal file")
            
            break  # If we successfully read one file, use it
            
        except Exception as e:
            print(f"Could not read {file_path}: {e}")
            continue
    
    # 3. Compare results
    print(f"\\n=" * 80)
    print("COMPARISON RESULTS")
    print("=" * 80)
    
    print(f"Platform journal entries: {len(platform_entries)}")
    print(f"Manual journal entries: {manual_total_entries}")
    print(f"Quest Agrovet in platform: {len(quest_platform_entries)}")
    print(f"Quest Agrovet in manual: {len(manual_quest_entries)}")
    
    # 4. Analysis and recommendations
    print(f"\\n=" * 80)
    print("ANALYSIS")
    print("=" * 80)
    
    if len(quest_platform_entries) > 0 and len(manual_quest_entries) == 0:
        print("❓ DISCREPANCY: Quest Agrovet appears in platform but NOT in manual journal")
        print("\\nPossible reasons:")
        print("1. Platform is processing additional data from uploaded Excel files")
        print("2. Platform is extracting data from Sales Register that manual journal doesn't include")
        print("3. Different data sources - platform processes raw transactions, manual is consolidated")
        
    elif len(quest_platform_entries) == 0 and len(manual_quest_entries) > 0:
        print("❓ DISCREPANCY: Quest Agrovet appears in manual but NOT in platform")
        print("\\nPossible reasons:")
        print("1. Platform filtering or processing logic excludes this entry")
        print("2. Data extraction from Excel files missed this transaction")
        print("3. Manual journal includes entries not present in uploaded source files")
        
    elif len(quest_platform_entries) > 0 and len(manual_quest_entries) > 0:
        print("✓ CONSISTENT: Quest Agrovet appears in both platform and manual journals")
        
    else:
        print("ℹ️  NEUTRAL: Quest Agrovet appears in neither platform nor manual journals")
    
    # 5. Show data sources that platform is processing
    print(f"\\n=" * 80)
    print("PLATFORM DATA SOURCES")
    print("=" * 80)
    
    try:
        extracted_response = requests.get(f'{BASE_URL}/extracted-data', headers=HEADERS)
        if extracted_response.status_code == 200:
            extracted_data = extracted_response.json()
            
            print("Platform is processing data from these sources:")
            if 'extractedData' in extracted_data:
                for doc in extracted_data['extractedData']:
                    filename = doc.get('filename', 'Unknown')
                    doc_type = doc.get('documentType', 'Unknown')
                    rows = doc.get('extractedRows', 0)
                    print(f"  - {filename} ({doc_type}) - {rows} transactions")
                    
                    # Check if Quest Agrovet is in this source
                    if 'data' in doc:
                        quest_in_source = any(
                            'quest' in str(row).lower() or 'agrovet' in str(row).lower() 
                            for row in doc['data'] if row
                        )
                        if quest_in_source:
                            print(f"    → Contains Quest Agrovet data ✓")
    
    except Exception as e:
        print(f"Could not fetch platform data sources: {e}")
    
    return {
        'platform_quest_entries': len(quest_platform_entries),
        'manual_quest_entries': len(manual_quest_entries),
        'platform_total': len(platform_entries),
        'manual_total': manual_total_entries
    }

if __name__ == "__main__":
    analyze_quest_agrovet_discrepancy()