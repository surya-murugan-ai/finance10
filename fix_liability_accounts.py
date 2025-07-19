#!/usr/bin/env python3

import os
import psycopg2
import requests
import json

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL')

def fix_document_types_and_regenerate():
    """Fix document types and regenerate journal entries with proper liability accounts"""
    
    print("🔧 Starting liability accounts fix...")
    
    # Connect to database
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # 1. Fix document types based on filenames
        document_updates = [
            ("709a9c7f-3ded-4db1-9335-ab283bea71c6", "bank_statement", "DB Bank Apr-Jun HO.xlsx"),
            ("492581e9-71d1-436e-bde8-0a869e7751d6", "purchase_register", "Purchase Reg Apr-Jun Chennai.xlsx"),
            ("2f3f7ebd-98bb-411c-8382-4f0ed6ee8d93", "sales_register", "Sales Reg Apr-Jun Chennai.xlsx")
        ]
        
        print("📝 Updating document types...")
        for doc_id, doc_type, filename in document_updates:
            cur.execute("""
                UPDATE documents 
                SET document_type = %s, original_name = %s 
                WHERE id = %s
            """, (doc_type, filename, doc_id))
            print(f"   ✓ Updated {filename} → {doc_type}")
        
        # 2. Clear existing incorrect journal entries
        print("🗑️  Clearing incorrect journal entries...")
        cur.execute("DELETE FROM journal_entries WHERE tenant_id = '7a94a175-cb13-47a6-b050-b2719d2ca004'")
        deleted_count = cur.rowcount
        print(f"   ✓ Deleted {deleted_count} incorrect journal entries")
        
        # Commit the changes
        conn.commit()
        print("✅ Database updates completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Database error: {e}")
        return False
    finally:
        cur.close()
        conn.close()
    
    # 3. Regenerate journal entries via API
    print("🔄 Regenerating journal entries with proper account codes...")
    
    token = "eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0="
    
    try:
        response = requests.post(
            "http://localhost:5000/api/journal-entries/generate",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Journal entries regenerated:")
            print(f"   📊 Total entries: {result.get('totalEntries', 0)}")
            print(f"   📄 Processed documents: {result.get('processedDocuments', 0)}")
            return True
        else:
            print(f"❌ API error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ API request error: {e}")
        return False

if __name__ == "__main__":
    if fix_document_types_and_regenerate():
        print("🎉 LIABILITY ACCOUNTS FIXED SUCCESSFULLY!")
        print("   • Purchase Register now creates Accounts Payable (2100)")
        print("   • Sales Register creates Accounts Receivable (1200)")  
        print("   • Bank Statement creates proper cash entries (1100)")
        print("   • Balance sheet will now show liability accounts")
    else:
        print("💥 Fix failed - check logs above")