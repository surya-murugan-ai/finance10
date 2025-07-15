#!/usr/bin/env python3
"""
Document Upload Security Test
Tests that document upload endpoints properly enforce tenant security
"""
import requests
import json
import time

class DocumentUploadSecurityTest:
    def __init__(self):
        self.base_url = "http://localhost:5000"
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "PASS" if success else "FAIL"
        result = {
            "test_name": test_name,
            "status": status,
            "details": details,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        print(f"[{status}] {test_name}: {details}")
    
    def test_invalid_user_upload_blocked(self):
        """Test that invalid user cannot upload documents"""
        # User without tenant assignment
        invalid_token = "eyJ1c2VySWQiOiI2cE11RHFxNW5uUG10Mkl3enVWbGIiLCJlbWFpbCI6InNoaXYuZGFzQHBhdHRlcm5lZmZlY3RzbGFicy5jb20ifQ=="
        
        # Create a test file
        test_file = ("test.csv", "id,name\n1,test\n", "text/csv")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/documents/upload",
                headers={"Authorization": f"Bearer {invalid_token}"},
                files={"file": test_file}
            )
            
            if response.status_code == 403:
                data = response.json()
                if "Access denied: User not assigned to any tenant" in data.get("message", ""):
                    self.log_test("Invalid User Upload Block", True, "User without tenant properly blocked")
                else:
                    self.log_test("Invalid User Upload Block", False, f"Wrong error message: {data.get('message')}")
            else:
                self.log_test("Invalid User Upload Block", False, f"Expected 403, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid User Upload Block", False, f"Exception: {str(e)}")
    
    def test_valid_user_upload_allowed(self):
        """Test that valid user can upload documents"""
        # User with tenant assignment
        valid_token = "eyJ1c2VySWQiOiI5ZTM2YzRkYi01NmM0LTQxNzUtOTk2Mi03ZDEwM2RiMmMxY2QiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIn0="
        
        # Create a test file
        test_file = ("test.csv", "id,name\n1,test\n", "text/csv")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/documents/upload",
                headers={"Authorization": f"Bearer {valid_token}"},
                files={"file": test_file}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "document" in data and "tenantId" in data["document"]:
                    self.log_test("Valid User Upload Allow", True, f"Upload successful with tenant: {data['document']['tenantId']}")
                else:
                    self.log_test("Valid User Upload Allow", False, "Missing document or tenantId in response")
            else:
                self.log_test("Valid User Upload Allow", False, f"Expected 200, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Valid User Upload Allow", False, f"Exception: {str(e)}")
    
    def test_invalid_user_document_list_blocked(self):
        """Test that invalid user cannot access document list"""
        invalid_token = "eyJ1c2VySWQiOiI2cE11RHFxNW5uUG10Mkl3enVWbGIiLCJlbWFpbCI6InNoaXYuZGFzQHBhdHRlcm5lZmZlY3RzbGFicy5jb20ifQ=="
        
        try:
            response = requests.get(
                f"{self.base_url}/api/documents",
                headers={"Authorization": f"Bearer {invalid_token}"}
            )
            
            if response.status_code == 403:
                data = response.json()
                if "Access denied: User not assigned to any tenant" in data.get("message", ""):
                    self.log_test("Invalid User Document List Block", True, "Document list access properly blocked")
                else:
                    self.log_test("Invalid User Document List Block", False, f"Wrong error message: {data.get('message')}")
            else:
                self.log_test("Invalid User Document List Block", False, f"Expected 403, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid User Document List Block", False, f"Exception: {str(e)}")
    
    def test_valid_user_document_list_allowed(self):
        """Test that valid user can access document list"""
        valid_token = "eyJ1c2VySWQiOiI5ZTM2YzRkYi01NmM0LTQxNzUtOTk2Mi03ZDEwM2RiMmMxY2QiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIn0="
        
        try:
            response = requests.get(
                f"{self.base_url}/api/documents",
                headers={"Authorization": f"Bearer {valid_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Valid User Document List Allow", True, f"Document list access successful, found {len(data)} documents")
            else:
                self.log_test("Valid User Document List Allow", False, f"Expected 200, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Valid User Document List Allow", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all security tests"""
        print("=== Document Upload Security Test ===")
        print("Testing document upload and access security...")
        print()
        
        self.test_invalid_user_upload_blocked()
        self.test_valid_user_upload_allowed()
        self.test_invalid_user_document_list_blocked()
        self.test_valid_user_document_list_allowed()
        
        print("\n=== Test Results Summary ===")
        passed = sum(1 for test in self.test_results if test["status"] == "PASS")
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n✅ ALL DOCUMENT UPLOAD SECURITY TESTS PASSED!")
            print("Document upload system properly enforces tenant security.")
        else:
            print("\n❌ SOME TESTS FAILED!")
            print("Review failed tests above.")
        
        return passed == total

if __name__ == "__main__":
    tester = DocumentUploadSecurityTest()
    tester.run_all_tests()