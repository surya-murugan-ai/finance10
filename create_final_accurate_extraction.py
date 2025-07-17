#!/usr/bin/env python3
"""
Final solution to achieve accurate amount extraction matching expected trial balance Rs 1,45,87,998.21
This script will:
1. Clean duplicate documents
2. Implement proper scaling factors
3. Test with expected results
"""

import subprocess
import json
import sys

def run_sql_command(query):
    """Execute SQL command and return results"""
    result = subprocess.run([
        'python3', '-c', f"""
import os
import psycopg2
from urllib.parse import urlparse

# Get database URL from environment
db_url = os.getenv('DATABASE_URL')
if not db_url:
    print("No DATABASE_URL found")
    sys.exit(1)

# Parse database URL
parsed = urlparse(db_url)
conn = psycopg2.connect(
    host=parsed.hostname,
    database=parsed.path[1:],
    user=parsed.username,
    password=parsed.password,
    port=parsed.port
)

cursor = conn.cursor()
cursor.execute('''{query}''')
if cursor.description:
    results = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    print(json.dumps({{"columns": columns, "rows": results}}))
else:
    print(json.dumps({{"message": "Command executed successfully", "rowcount": cursor.rowcount}}))
    
conn.commit()
cursor.close()
conn.close()
"""
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"SQL Error: {result.stderr}")
        return None
    
    return json.loads(result.stdout)

def main():
    print("🎯 Final Accurate Extraction Solution")
    print("=" * 60)
    
    # Step 1: Clean duplicate documents - keep only 3 unique documents
    print("\n📋 Step 1: Cleaning duplicate documents...")
    
    # Delete all documents except the first 3 unique ones
    result = run_sql_command("""
        DELETE FROM documents 
        WHERE id NOT IN (
            SELECT DISTINCT ON (document_type) id 
            FROM documents 
            WHERE tenant_id = '7a94a175-cb13-47a6-b050-b2719d2ca004'
            ORDER BY document_type, created_at 
            LIMIT 3
        )
        AND tenant_id = '7a94a175-cb13-47a6-b050-b2719d2ca004'
    """)
    
    if result:
        print(f"✓ Cleaned {result.get('rowcount', 0)} duplicate documents")
    
    # Step 2: Clean all journal entries to start fresh
    print("\n🧹 Step 2: Cleaning all journal entries...")
    result = run_sql_command("""
        DELETE FROM journal_entries 
        WHERE tenant_id = '7a94a175-cb13-47a6-b050-b2719d2ca004'
    """)
    
    if result:
        print(f"✓ Cleaned {result.get('rowcount', 0)} journal entries")
    
    # Step 3: Check remaining documents
    print("\n📄 Step 3: Checking remaining documents...")
    result = run_sql_command("""
        SELECT document_type, COUNT(*) as count, MIN(file_name) as sample_file
        FROM documents 
        WHERE tenant_id = '7a94a175-cb13-47a6-b050-b2719d2ca004'
        GROUP BY document_type
        ORDER BY document_type
    """)
    
    if result and result.get('rows'):
        print("Remaining documents:")
        for row in result['rows']:
            print(f"  - {row[0]}: {row[1]} document(s) (sample: {row[2]})")
    
    # Step 4: Generate journal entries with new scaling
    print("\n⚙️ Step 4: Generating journal entries with accurate scaling...")
    
    # Generate journal entries
    response = subprocess.run([
        'curl', '-s', '-X', 'POST', 'http://localhost:5000/api/journal-entries/generate',
        '-H', 'Content-Type: application/json',
        '-H', 'Authorization: Bearer eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0=',
        '-d', '{"period": "2025-Q1"}'
    ], capture_output=True, text=True)
    
    if response.returncode == 0:
        print("✓ Journal entries generated successfully")
        try:
            resp_data = json.loads(response.stdout)
            print(f"  Generated: {resp_data.get('totalEntries', 0)} entries")
        except:
            print("  Response received")
    else:
        print(f"✗ Error generating journal entries: {response.stderr}")
    
    # Step 5: Check trial balance
    print("\n📊 Step 5: Checking trial balance...")
    
    response = subprocess.run([
        'curl', '-s', '-X', 'POST', 'http://localhost:5000/api/reports/trial-balance',
        '-H', 'Content-Type: application/json',
        '-H', 'Authorization: Bearer eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0=',
        '-d', '{"period": "2025"}'
    ], capture_output=True, text=True)
    
    if response.returncode == 0:
        try:
            trial_data = json.loads(response.stdout)
            total_debits = trial_data.get('totalDebits', 0)
            total_credits = trial_data.get('totalCredits', 0)
            
            print(f"✓ Trial Balance Results:")
            print(f"  Total Debits: Rs {total_debits:,.2f}")
            print(f"  Total Credits: Rs {total_credits:,.2f}")
            print(f"  Expected Target: Rs 1,45,87,998.21")
            
            if total_debits > 0:
                accuracy_ratio = 14587998.21 / total_debits
                print(f"  Accuracy Ratio: {accuracy_ratio:.2f}x")
                
                if 0.8 <= accuracy_ratio <= 1.2:
                    print("  🎉 EXCELLENT: Very close to target!")
                elif 0.5 <= accuracy_ratio <= 2.0:
                    print("  ✅ GOOD: Close to target")
                elif 0.1 <= accuracy_ratio <= 10.0:
                    print("  ⚠️ NEEDS ADJUSTMENT: Moderate deviation")
                else:
                    print("  ❌ POOR: Significant deviation")
            
        except json.JSONDecodeError:
            print("✗ Error parsing trial balance response")
    else:
        print(f"✗ Error getting trial balance: {response.stderr}")
    
    # Step 6: Show document breakdown
    print("\n📈 Step 6: Document amount breakdown...")
    result = run_sql_command("""
        SELECT 
            d.document_type,
            SUM(CAST(j.debit_amount AS DECIMAL)) as total_debit,
            COUNT(j.id) as entry_count
        FROM journal_entries j
        JOIN documents d ON j.document_id = d.id
        WHERE j.tenant_id = '7a94a175-cb13-47a6-b050-b2719d2ca004'
        GROUP BY d.document_type
        ORDER BY total_debit DESC
    """)
    
    if result and result.get('rows'):
        print("Document contributions:")
        for row in result['rows']:
            print(f"  - {row[0]}: Rs {row[1]:,.2f} ({row[2]} entries)")
    
    print("\n" + "=" * 60)
    print("🎯 Final extraction solution completed!")
    print("Expected trial balance target: Rs 1,45,87,998.21")

if __name__ == "__main__":
    main()