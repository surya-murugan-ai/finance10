"""
Compliance checking service for financial documents
"""
from typing import Dict, List, Any
from datetime import datetime
from ..models import Document

class ComplianceChecker:
    """Handle compliance validation for financial documents"""
    
    def __init__(self):
        self.gst_rates = {
            'essential_goods': 0.05,
            'standard_goods': 0.18,
            'luxury_goods': 0.28,
            'services': 0.18
        }
        
        self.tds_rates = {
            'salary': 0.10,
            'professional_services': 0.10,
            'contractor': 0.01,
            'rent': 0.10,
            'commission': 0.05
        }
    
    async def check_compliance(self, document: Document) -> Dict[str, Any]:
        """Check document compliance"""
        
        compliance_checks = []
        violations = []
        recommendations = []
        
        # Extract document data
        doc_data = document.extracted_data or {}
        doc_type = document.document_type
        
        # Run appropriate compliance checks
        if doc_type == 'vendor_invoice':
            gst_check = await self._check_gst_compliance(doc_data)
            compliance_checks.append(gst_check)
            
        elif doc_type == 'salary_register':
            tds_check = await self._check_tds_compliance(doc_data)
            compliance_checks.append(tds_check)
            
        elif doc_type == 'gst_return':
            gst_return_check = await self._check_gst_return_compliance(doc_data)
            compliance_checks.append(gst_return_check)
            
        elif doc_type == 'tds_certificate':
            tds_cert_check = await self._check_tds_certificate_compliance(doc_data)
            compliance_checks.append(tds_cert_check)
        
        # Compile results
        total_checks = len(compliance_checks)
        passed_checks = sum(1 for check in compliance_checks if check['passed'])
        
        overall_score = (passed_checks / total_checks * 100) if total_checks > 0 else 0
        
        # Collect violations and recommendations
        for check in compliance_checks:
            violations.extend(check.get('violations', []))
            recommendations.extend(check.get('recommendations', []))
        
        return {
            'result': 'passed' if overall_score >= 80 else 'failed',
            'score': overall_score,
            'violations': violations,
            'recommendations': recommendations,
            'checks_performed': compliance_checks,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def _check_gst_compliance(self, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check GST compliance for invoices"""
        violations = []
        recommendations = []
        
        # Check GSTIN format
        gstin = doc_data.get('gstin', '')
        if not self._validate_gstin(gstin):
            violations.append('Invalid GSTIN format')
            recommendations.append('Ensure GSTIN follows 15-character format: 22AAAAA0000A1Z5')
        
        # Check HSN/SAC codes
        line_items = doc_data.get('line_items', [])
        for item in line_items:
            hsn_code = item.get('hsn_code', '')
            if not hsn_code or len(hsn_code) < 4:
                violations.append(f'Missing or invalid HSN code for item: {item.get("description", "Unknown")}')
                recommendations.append('Provide valid HSN/SAC codes for all items')
        
        # Check tax calculations
        total_amount = doc_data.get('total_amount', 0)
        tax_amount = doc_data.get('tax_amount', 0)
        
        if total_amount > 0 and tax_amount == 0:
            violations.append('No GST applied on taxable transaction')
            recommendations.append('Apply appropriate GST rates based on goods/services')
        
        return {
            'check_type': 'gst_compliance',
            'passed': len(violations) == 0,
            'violations': violations,
            'recommendations': recommendations
        }
    
    async def _check_tds_compliance(self, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check TDS compliance for salary documents"""
        violations = []
        recommendations = []
        
        employees = doc_data.get('employees', [])
        
        for employee in employees:
            basic_salary = employee.get('basic_salary', 0)
            tds_deducted = employee.get('tds_deducted', 0)
            
            # Check TDS threshold
            annual_salary = basic_salary * 12
            if annual_salary > 250000 and tds_deducted == 0:
                violations.append(f'TDS not deducted for {employee.get("employee_name", "Unknown")} exceeding exemption limit')
                recommendations.append('Deduct TDS as per applicable rates for salaries exceeding ₹2.5 lakhs')
            
            # Check TDS rate
            if tds_deducted > 0:
                expected_tds = basic_salary * self.tds_rates.get('salary', 0.10)
                if abs(tds_deducted - expected_tds) > 100:  # Allow small variance
                    violations.append(f'TDS rate appears incorrect for {employee.get("employee_name", "Unknown")}')
                    recommendations.append('Verify TDS rates as per latest income tax rules')
        
        return {
            'check_type': 'tds_compliance',
            'passed': len(violations) == 0,
            'violations': violations,
            'recommendations': recommendations
        }
    
    async def _check_gst_return_compliance(self, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check GST return compliance"""
        violations = []
        recommendations = []
        
        # Check return period
        return_period = doc_data.get('return_period', '')
        if not return_period:
            violations.append('Return period not specified')
            recommendations.append('Specify correct return period (MM/YYYY)')
        
        # Check filing deadline
        filing_date = doc_data.get('filing_date', '')
        if not filing_date:
            violations.append('Filing date not specified')
            recommendations.append('Ensure timely filing within due dates')
        
        # Check turnover reconciliation
        declared_turnover = doc_data.get('declared_turnover', 0)
        calculated_turnover = doc_data.get('calculated_turnover', 0)
        
        if abs(declared_turnover - calculated_turnover) > 1000:
            violations.append('Turnover mismatch between declared and calculated amounts')
            recommendations.append('Reconcile turnover figures with books of accounts')
        
        return {
            'check_type': 'gst_return_compliance',
            'passed': len(violations) == 0,
            'violations': violations,
            'recommendations': recommendations
        }
    
    async def _check_tds_certificate_compliance(self, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check TDS certificate compliance"""
        violations = []
        recommendations = []
        
        # Check TAN format
        tan = doc_data.get('tan', '')
        if not self._validate_tan(tan):
            violations.append('Invalid TAN format')
            recommendations.append('Ensure TAN follows 10-character format: AAAA12345A')
        
        # Check certificate details
        required_fields = ['deductee_name', 'deductee_pan', 'amount_paid', 'tax_deducted', 'assessment_year']
        for field in required_fields:
            if not doc_data.get(field):
                violations.append(f'Missing required field: {field}')
                recommendations.append(f'Provide {field} in TDS certificate')
        
        return {
            'check_type': 'tds_certificate_compliance',
            'passed': len(violations) == 0,
            'violations': violations,
            'recommendations': recommendations
        }
    
    def _validate_gstin(self, gstin: str) -> bool:
        """Validate GSTIN format"""
        if not gstin or len(gstin) != 15:
            return False
        
        # Basic format check: 22AAAAA0000A1Z5
        # First 2 digits: state code
        # Next 10 characters: PAN
        # 13th character: entity number
        # 14th character: Z (default)
        # 15th character: checksum
        
        return (gstin[:2].isdigit() and 
                gstin[2:12].isalnum() and 
                gstin[12].isdigit() and 
                gstin[13] == 'Z' and 
                gstin[14].isdigit())
    
    def _validate_tan(self, tan: str) -> bool:
        """Validate TAN format"""
        if not tan or len(tan) != 10:
            return False
        
        # Format: AAAA12345A
        return (tan[:4].isalpha() and 
                tan[4:9].isdigit() and 
                tan[9].isalpha())
    
    def get_compliance_score(self, checks: List[Dict[str, Any]]) -> float:
        """Calculate overall compliance score"""
        if not checks:
            return 0.0
        
        passed_checks = sum(1 for check in checks if check.get('passed', False))
        return (passed_checks / len(checks)) * 100