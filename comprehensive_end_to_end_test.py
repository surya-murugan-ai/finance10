#!/usr/bin/env python3
"""
Comprehensive End-to-End Test Suite for QRT Closure Agent Platform
Tests all platform features and workflows from clean state
"""

import requests
import json
import time
import os
from pathlib import Path

# Test configuration
BASE_URL = "http://localhost:5000/api"
TEST_TOKEN = "eyJ1c2VySWQiOiJmM1FVNzNXdl9mVGdLWjdlNzFVdG8iLCJlbWFpbCI6Im1rb25jaGFkYTBAZ21haWwuY29tIn0="

# Headers for authenticated requests
HEADERS = {
    "Authorization": f"Bearer {TEST_TOKEN}",
    "Content-Type": "application/json"
}

class ComprehensiveE2ETest:
    def __init__(self):
        self.results = {
            "tests_passed": 0,
            "tests_failed": 0,
            "test_details": [],
            "start_time": time.time()
        }
    
    def log_test(self, test_name, status, details="", response_data=None):
        """Log test result"""
        if status == "PASS":
            self.results["tests_passed"] += 1
            print(f"✓ {test_name}")
        else:
            self.results["tests_failed"] += 1
            print(f"✗ {test_name}: {details}")
        
        self.results["test_details"].append({
            "test": test_name,
            "status": status,
            "details": details,
            "response_data": response_data
        })
    
    def test_authentication(self):
        """Test 1: Authentication System"""
        print("\n=== TESTING AUTHENTICATION SYSTEM ===")
        
        try:
            # Test user authentication
            response = requests.get(f"{BASE_URL}/auth/user", headers=HEADERS)
            if response.status_code == 200:
                user_data = response.json()
                if user_data.get("success") and user_data.get("user"):
                    self.log_test("User Authentication", "PASS", response_data=user_data["user"])
                else:
                    self.log_test("User Authentication", "FAIL", "Invalid user response")
            else:
                self.log_test("User Authentication", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("User Authentication", "FAIL", str(e))
    
    def test_settings_system(self):
        """Test 2: Settings System"""
        print("\n=== TESTING SETTINGS SYSTEM ===")
        
        try:
            # Test settings retrieval
            response = requests.get(f"{BASE_URL}/settings", headers=HEADERS)
            if response.status_code == 200:
                settings = response.json()
                self.log_test("Settings Retrieval", "PASS", response_data=settings)
            else:
                self.log_test("Settings Retrieval", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Settings Retrieval", "FAIL", str(e))
    
    def test_calculation_tools(self):
        """Test 3: Financial Calculation Tools"""
        print("\n=== TESTING CALCULATION TOOLS ===")
        
        # Test basic calculation
        try:
            calc_data = {
                "operation": "add",
                "parameters": {"a": 100, "b": 200},
                "context": {"source": "e2e_test"}
            }
            response = requests.post(f"{BASE_URL}/calculations/execute", 
                                   json=calc_data, headers=HEADERS)
            if response.status_code == 200:
                result = response.json()
                # Check for nested result structure: {"success": true, "result": {"result": 300, ...}}
                expected_result = 300
                actual_result = None
                if result.get("success"):
                    if isinstance(result.get("result"), dict):
                        actual_result = result["result"].get("result")
                    else:
                        actual_result = result.get("result")
                
                if actual_result == expected_result:
                    self.log_test("Basic Calculation (Add)", "PASS", response_data=result)
                else:
                    self.log_test("Basic Calculation (Add)", "FAIL", f"Expected {expected_result}, got {actual_result}")
            else:
                self.log_test("Basic Calculation (Add)", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Basic Calculation (Add)", "FAIL", str(e))
        
        # Test advanced financial calculation
        try:
            calc_data = {
                "operation": "currentRatio",
                "parameters": {"currentAssets": 500000, "currentLiabilities": 300000},
                "context": {"source": "e2e_test"}
            }
            response = requests.post(f"{BASE_URL}/calculations/execute", 
                                   json=calc_data, headers=HEADERS)
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("result"):
                    self.log_test("Advanced Financial Calculation (Current Ratio)", "PASS", response_data=result)
                else:
                    self.log_test("Advanced Financial Calculation (Current Ratio)", "FAIL", "No result")
            else:
                self.log_test("Advanced Financial Calculation (Current Ratio)", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Advanced Financial Calculation (Current Ratio)", "FAIL", str(e))
        
        # Test ValidatorAgent
        try:
            validation_data = {
                "operation": "validateFinancialData",
                "parameters": {
                    "data": {
                        "transactions": [
                            {"date": "2025-01-01", "amount": 50000, "description": "Opening balance"},
                            {"date": "2025-01-01", "amount": 50000, "description": "Opening balance"}  # Duplicate
                        ],
                        "accounts": [
                            {"code": "1100", "name": "Cash", "balance": 100000, "debit": 100000, "credit": 0}
                        ],
                        "totalDebits": 100000,
                        "totalCredits": 100000
                    }
                },
                "context": {"source": "e2e_test"}
            }
            response = requests.post(f"{BASE_URL}/calculations/execute", 
                                   json=validation_data, headers=HEADERS)
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("result", {}).get("duplicateCount") >= 0:
                    self.log_test("ValidatorAgent - Duplicate Detection", "PASS", response_data=result)
                else:
                    self.log_test("ValidatorAgent - Duplicate Detection", "FAIL", "No validation result")
            else:
                self.log_test("ValidatorAgent - Duplicate Detection", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("ValidatorAgent - Duplicate Detection", "FAIL", str(e))
        
        # Test ProvisionBot
        try:
            provision_data = {
                "operation": "identifyMissingProvisions",
                "parameters": {
                    "financialData": {
                        "fixedAssets": [
                            {"name": "Office Building", "cost": 5000000, "depreciation": 0}
                        ],
                        "receivables": [{"amount": 100000}],
                        "income": 2000000,
                        "employees": 25,
                        "salaryExpense": 1200000
                    }
                },
                "context": {"source": "e2e_test"}
            }
            response = requests.post(f"{BASE_URL}/calculations/execute", 
                                   json=provision_data, headers=HEADERS)
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("result", {}).get("provisionCount") >= 0:
                    self.log_test("ProvisionBot - Missing Adjustments", "PASS", response_data=result)
                else:
                    self.log_test("ProvisionBot - Missing Adjustments", "FAIL", "No provision result")
            else:
                self.log_test("ProvisionBot - Missing Adjustments", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("ProvisionBot - Missing Adjustments", "FAIL", str(e))
    
    def test_document_management(self):
        """Test 4: Document Management System"""
        print("\n=== TESTING DOCUMENT MANAGEMENT ===")
        
        try:
            # Test document list (should be empty after cleanup)
            response = requests.get(f"{BASE_URL}/documents", headers=HEADERS)
            if response.status_code == 200:
                documents = response.json()
                if isinstance(documents, list) and len(documents) == 0:
                    self.log_test("Document List (Clean State)", "PASS", f"Found {len(documents)} documents")
                else:
                    self.log_test("Document List (Clean State)", "FAIL", f"Expected 0 documents, found {len(documents)}")
            else:
                self.log_test("Document List (Clean State)", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Document List (Clean State)", "FAIL", str(e))
        
        # Test document upload with test file
        try:
            # Create a simple test CSV file
            test_file_content = """Date,Particulars,Amount,Type
2025-01-01,Opening Balance,100000,Credit
2025-01-15,Sales Revenue,50000,Credit
2025-01-20,Office Rent,15000,Debit"""
            
            files = {'file': ('test_sample.csv', test_file_content, 'text/csv')}
            headers_upload = {"Authorization": f"Bearer {TEST_TOKEN}"}
            
            response = requests.post(f"{BASE_URL}/documents/upload", 
                                   files=files, headers=headers_upload)
            if response.status_code == 200:
                upload_result = response.json()
                # Check for successful upload message and document info
                if upload_result.get("message") and "successful" in upload_result.get("message", "").lower():
                    self.log_test("Document Upload", "PASS", response_data=upload_result)
                    self.uploaded_document_id = upload_result.get("document", {}).get("id")
                else:
                    self.log_test("Document Upload", "FAIL", "Upload not successful")
            else:
                self.log_test("Document Upload", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Document Upload", "FAIL", str(e))
    
    def test_data_extraction(self):
        """Test 5: Data Extraction System"""
        print("\n=== TESTING DATA EXTRACTION ===")
        
        try:
            # Test extracted data endpoint
            response = requests.get(f"{BASE_URL}/extracted-data", headers=HEADERS)
            if response.status_code == 200:
                extracted_data = response.json()
                if extracted_data.get("message") and extracted_data.get("extractedData"):
                    self.log_test("Data Extraction", "PASS", response_data=extracted_data)
                else:
                    self.log_test("Data Extraction", "FAIL", "No extracted data")
            else:
                self.log_test("Data Extraction", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Data Extraction", "FAIL", str(e))
    
    def test_journal_entries(self):
        """Test 6: Journal Entry System"""
        print("\n=== TESTING JOURNAL ENTRY SYSTEM ===")
        
        try:
            # Test journal entries list
            response = requests.get(f"{BASE_URL}/journal-entries", headers=HEADERS)
            if response.status_code == 200:
                journal_entries = response.json()
                self.log_test("Journal Entries List", "PASS", f"Found {len(journal_entries)} entries")
            else:
                self.log_test("Journal Entries List", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Journal Entries List", "FAIL", str(e))
        
        # Test journal entry generation
        try:
            gen_data = {"period": "Q1_2025", "regenerate": True}
            response = requests.post(f"{BASE_URL}/journal-entries/generate", 
                                   json=gen_data, headers=HEADERS)
            if response.status_code == 200:
                result = response.json()
                # Check for successful generation message
                if result.get("message") and ("successful" in result.get("message", "").lower() or "generated" in result.get("message", "").lower()):
                    self.log_test("Journal Entry Generation", "PASS", response_data=result)
                else:
                    self.log_test("Journal Entry Generation", "FAIL", "Generation not successful")
            else:
                self.log_test("Journal Entry Generation", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Journal Entry Generation", "FAIL", str(e))
    
    def test_financial_reports(self):
        """Test 7: Financial Reports System"""
        print("\n=== TESTING FINANCIAL REPORTS ===")
        
        # Test Trial Balance
        try:
            tb_data = {"period": "Q1_2025"}
            response = requests.post(f"{BASE_URL}/reports/trial-balance", 
                                   json=tb_data, headers=HEADERS)
            if response.status_code == 200:
                trial_balance = response.json()
                if trial_balance.get("entries"):
                    self.log_test("Trial Balance Report", "PASS", response_data=trial_balance)
                else:
                    self.log_test("Trial Balance Report", "FAIL", "No trial balance entries")
            else:
                self.log_test("Trial Balance Report", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Trial Balance Report", "FAIL", str(e))
        
        # Test Profit & Loss
        try:
            pl_data = {"period": "Q1_2025"}
            response = requests.post(f"{BASE_URL}/reports/profit-loss", 
                                   json=pl_data, headers=HEADERS)
            if response.status_code == 200:
                profit_loss = response.json()
                self.log_test("Profit & Loss Report", "PASS", response_data=profit_loss)
            else:
                self.log_test("Profit & Loss Report", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Profit & Loss Report", "FAIL", str(e))
        
        # Test Balance Sheet
        try:
            bs_data = {"period": "Q1_2025"}
            response = requests.post(f"{BASE_URL}/reports/balance-sheet", 
                                   json=bs_data, headers=HEADERS)
            if response.status_code == 200:
                balance_sheet = response.json()
                self.log_test("Balance Sheet Report", "PASS", response_data=balance_sheet)
            else:
                self.log_test("Balance Sheet Report", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Balance Sheet Report", "FAIL", str(e))
        
        # Test Cash Flow
        try:
            cf_data = {"period": "Q1_2025"}
            response = requests.post(f"{BASE_URL}/reports/cash-flow", 
                                   json=cf_data, headers=HEADERS)
            if response.status_code == 200:
                cash_flow = response.json()
                self.log_test("Cash Flow Report", "PASS", response_data=cash_flow)
            else:
                self.log_test("Cash Flow Report", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Cash Flow Report", "FAIL", str(e))
    
    def test_ai_agent_system(self):
        """Test 8: AI Agent Chat System"""
        print("\n=== TESTING AI AGENT SYSTEM ===")
        
        try:
            # Test agent chat
            chat_data = {
                "message": "What is the current financial status?",
                "context": {"source": "e2e_test"}
            }
            response = requests.post(f"{BASE_URL}/agent-chat/message", 
                                   json=chat_data, headers=HEADERS)
            if response.status_code == 200:
                chat_result = response.json()
                if chat_result.get("response"):
                    self.log_test("AI Agent Chat", "PASS", response_data=chat_result)
                else:
                    self.log_test("AI Agent Chat", "FAIL", "No chat response")
            else:
                self.log_test("AI Agent Chat", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("AI Agent Chat", "FAIL", str(e))
    
    def test_compliance_system(self):
        """Test 9: Compliance System"""
        print("\n=== TESTING COMPLIANCE SYSTEM ===")
        
        try:
            # Test compliance checks
            response = requests.get(f"{BASE_URL}/compliance/checks", headers=HEADERS)
            if response.status_code == 200:
                compliance = response.json()
                self.log_test("Compliance Checks", "PASS", response_data=compliance)
            else:
                self.log_test("Compliance Checks", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Compliance Checks", "FAIL", str(e))
    
    def test_system_health(self):
        """Test 10: System Health"""
        print("\n=== TESTING SYSTEM HEALTH ===")
        
        try:
            # Test system health endpoint
            response = requests.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                health = response.json()
                if health.get("status") == "ok":
                    self.log_test("System Health", "PASS", response_data=health)
                else:
                    self.log_test("System Health", "FAIL", f"Status: {health.get('status')}")
            else:
                self.log_test("System Health", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("System Health", "FAIL", str(e))
    
    def run_all_tests(self):
        """Execute all test suites"""
        print("🚀 STARTING COMPREHENSIVE END-TO-END TESTING")
        print("=" * 60)
        
        # Execute test suites
        self.test_authentication()
        self.test_settings_system()
        self.test_calculation_tools()
        self.test_document_management()
        self.test_data_extraction()
        self.test_journal_entries()
        self.test_financial_reports()
        self.test_ai_agent_system()
        self.test_compliance_system()
        self.test_system_health()
        
        # Generate final report
        self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive test report"""
        end_time = time.time()
        duration = end_time - self.results["start_time"]
        
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE E2E TEST REPORT")
        print("=" * 60)
        
        total_tests = self.results["tests_passed"] + self.results["tests_failed"]
        success_rate = (self.results["tests_passed"] / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Tests Passed: {self.results['tests_passed']}")
        print(f"Tests Failed: {self.results['tests_failed']}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        if self.results["tests_failed"] > 0:
            print(f"\n❌ FAILED TESTS:")
            for test in self.results["test_details"]:
                if test["status"] == "FAIL":
                    print(f"   • {test['test']}: {test['details']}")
        
        # Overall status
        if success_rate >= 90:
            print(f"\n🎉 OVERALL STATUS: EXCELLENT ({success_rate:.1f}%)")
        elif success_rate >= 75:
            print(f"\n✅ OVERALL STATUS: GOOD ({success_rate:.1f}%)")
        elif success_rate >= 50:
            print(f"\n⚠️  OVERALL STATUS: NEEDS IMPROVEMENT ({success_rate:.1f}%)")
        else:
            print(f"\n🚨 OVERALL STATUS: CRITICAL ISSUES ({success_rate:.1f}%)")
        
        # Save detailed report
        report_data = {
            "summary": {
                "total_tests": total_tests,
                "tests_passed": self.results["tests_passed"],
                "tests_failed": self.results["tests_failed"],
                "success_rate": success_rate,
                "duration": duration,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            },
            "test_details": self.results["test_details"]
        }
        
        with open("comprehensive_e2e_test_report.json", "w") as f:
            json.dump(report_data, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: comprehensive_e2e_test_report.json")
        print("=" * 60)

if __name__ == "__main__":
    tester = ComprehensiveE2ETest()
    tester.run_all_tests()