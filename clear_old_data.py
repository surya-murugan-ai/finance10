#!/usr/bin/env python3
"""
Clear old data from the database for fresh testing
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
AUTH_TOKEN = "eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0="

headers = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

def clear_all_data():
    """Clear all existing data from the database"""
    print("Clearing all existing data...")
    
    # Clear journal entries
    print("1. Clearing journal entries...")
    try:
        response = requests.get(f"{BASE_URL}/api/journal-entries", headers=headers)
        if response.status_code == 200:
            entries = response.json()
            print(f"   Found {len(entries)} journal entries to delete")
            
            for entry in entries:
                delete_response = requests.delete(f"{BASE_URL}/api/journal-entries/{entry['id']}", headers=headers)
                if delete_response.status_code == 200:
                    print(f"   ✓ Deleted journal entry {entry['id']}")
                else:
                    print(f"   ✗ Failed to delete journal entry {entry['id']}: {delete_response.status_code}")
        else:
            print(f"   Error getting journal entries: {response.status_code}")
    except Exception as e:
        print(f"   Error clearing journal entries: {str(e)}")
    
    # Clear financial statements
    print("\n2. Clearing financial statements...")
    try:
        response = requests.get(f"{BASE_URL}/api/financial-statements", headers=headers)
        if response.status_code == 200:
            statements = response.json()
            print(f"   Found {len(statements)} financial statements to delete")
            
            for statement in statements:
                delete_response = requests.delete(f"{BASE_URL}/api/financial-statements/{statement['id']}", headers=headers)
                if delete_response.status_code == 200:
                    print(f"   ✓ Deleted financial statement {statement['id']}")
                else:
                    print(f"   ✗ Failed to delete financial statement {statement['id']}: {delete_response.status_code}")
        else:
            print(f"   Error getting financial statements: {response.status_code}")
    except Exception as e:
        print(f"   Error clearing financial statements: {str(e)}")
    
    # Clear documents (optional - keep if you want to keep uploaded files)
    print("\n3. Clearing documents...")
    try:
        response = requests.get(f"{BASE_URL}/api/documents", headers=headers)
        if response.status_code == 200:
            documents = response.json()
            print(f"   Found {len(documents)} documents to delete")
            
            for doc in documents:
                delete_response = requests.delete(f"{BASE_URL}/api/documents/{doc['id']}", headers=headers)
                if delete_response.status_code == 200:
                    print(f"   ✓ Deleted document {doc['originalName']}")
                else:
                    print(f"   ✗ Failed to delete document {doc['originalName']}: {delete_response.status_code}")
        else:
            print(f"   Error getting documents: {response.status_code}")
    except Exception as e:
        print(f"   Error clearing documents: {str(e)}")
    
    print("\n" + "="*50)
    print("Data clearing completed!")
    print("="*50)

if __name__ == "__main__":
    clear_all_data()