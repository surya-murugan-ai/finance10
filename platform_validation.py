#!/usr/bin/env python3
"""
QRT Closure Platform - Comprehensive Validation Suite
Validates all components and generates a complete status report
"""

import sys
import os
import json
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

class PlatformValidator:
    """Comprehensive validator for all platform components"""
    
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'platform_name': 'QRT Closure Agent Platform',
            'validation_results': {},
            'overall_status': 'UNKNOWN',
            'critical_issues': [],
            'recommendations': []
        }
    
    def validate_core_imports(self) -> Dict[str, Any]:
        """Validate that all core modules can be imported"""
        print("🔍 Validating core imports...")
        
        import_results = {}
        core_modules = [
            ('main', 'FastAPI Application'),
            ('app.auth', 'Authentication Module'),
            ('app.models', 'Database Models'),
            ('app.database', 'Database Connection'),
            ('app.services.auth_service', 'Authentication Service'),
            ('app.services.document_processor', 'Document Processing'),
            ('app.services.ai_orchestrator', 'AI Orchestrator'),
            ('app.services.compliance_checker', 'Compliance Checker'),
            ('app.services.financial_reports', 'Financial Reports'),
            ('app.services.ml_anomaly_detector', 'ML Anomaly Detection'),
            ('app.services.data_source_service', 'Data Source Service'),
            ('app.services.mca_filing_service', 'MCA Filing Service'),
            ('app.services.tutorial_service', 'Tutorial Service')
        ]
        
        successful_imports = 0
        
        for module_name, description in core_modules:
            try:
                __import__(module_name)
                import_results[module_name] = {
                    'status': 'SUCCESS',
                    'description': description,
                    'error': None
                }
                successful_imports += 1
                print(f"  ✅ {description}")
            except Exception as e:
                import_results[module_name] = {
                    'status': 'FAILED',
                    'description': description,
                    'error': str(e)
                }
                print(f"  ❌ {description}: {str(e)}")
        
        return {
            'total_modules': len(core_modules),
            'successful_imports': successful_imports,
            'success_rate': (successful_imports / len(core_modules)) * 100,
            'details': import_results
        }
    
    def validate_authentication_system(self) -> Dict[str, Any]:
        """Validate authentication system functionality"""
        print("\n🔐 Validating authentication system...")
        
        try:
            from app.auth import get_password_hash, verify_password
            from app.services.auth_service import AuthService
            
            # Test password hashing
            test_password = "TestPassword123!"
            hashed = get_password_hash(test_password)
            verified = verify_password(test_password, hashed)
            
            if not verified:
                raise Exception("Password verification failed")
            
            # Test service instantiation
            auth_service = AuthService()
            
            print("  ✅ Password hashing and verification")
            print("  ✅ Authentication service instantiation")
            
            return {
                'status': 'SUCCESS',
                'components': {
                    'password_hashing': True,
                    'service_instantiation': True
                },
                'error': None
            }
            
        except Exception as e:
            print(f"  ❌ Authentication system failed: {str(e)}")
            return {
                'status': 'FAILED',
                'components': {
                    'password_hashing': False,
                    'service_instantiation': False
                },
                'error': str(e)
            }
    
    def validate_compliance_engine(self) -> Dict[str, Any]:
        """Validate compliance checking functionality"""
        print("\n🏛️ Validating compliance engine...")
        
        try:
            from app.services.compliance_checker import ComplianceChecker
            
            checker = ComplianceChecker()
            
            # Test GST validation
            gst_test_data = {
                'gst_number': '29ABCDE1234F1Z5',
                'cgst': 100,
                'sgst': 100,
                'igst': 0,
                'total_tax': 200,
                'total_amount': 1200
            }
            
            gst_result = checker.validate_gst(gst_test_data)
            
            if not gst_result.get('valid'):
                raise Exception("GST validation failed")
            
            # Test TDS validation
            tds_test_data = {
                'transaction_amount': 10000,
                'tds_rate': 10,
                'deducted_amount': 1000
            }
            
            tds_result = checker.validate_tds(tds_test_data)
            
            if not tds_result.get('valid'):
                raise Exception("TDS validation failed")
            
            print("  ✅ GST validation")
            print("  ✅ TDS validation")
            
            return {
                'status': 'SUCCESS',
                'components': {
                    'gst_validation': True,
                    'tds_validation': True
                },
                'test_results': {
                    'gst': gst_result,
                    'tds': tds_result
                },
                'error': None
            }
            
        except Exception as e:
            print(f"  ❌ Compliance engine failed: {str(e)}")
            return {
                'status': 'FAILED',
                'components': {
                    'gst_validation': False,
                    'tds_validation': False
                },
                'error': str(e)
            }
    
    def validate_financial_reports(self) -> Dict[str, Any]:
        """Validate financial reporting system"""
        print("\n📊 Validating financial reports...")
        
        try:
            from app.services.financial_reports import FinancialReportsService
            
            reports_service = FinancialReportsService()
            
            # Test trial balance generation
            trial_balance = reports_service.generate_trial_balance("2024-Q1")
            
            if not trial_balance or 'accounts' not in trial_balance:
                raise Exception("Trial balance generation failed")
            
            # Test other report generation
            profit_loss = reports_service._generate_profit_loss("2024-Q1")
            balance_sheet = reports_service._generate_balance_sheet("2024-Q1")
            cash_flow = reports_service._generate_cash_flow("2024-Q1")
            
            if not all([profit_loss, balance_sheet, cash_flow]):
                raise Exception("Report generation failed")
            
            print("  ✅ Trial balance generation")
            print("  ✅ Profit & Loss statement")
            print("  ✅ Balance sheet")
            print("  ✅ Cash flow statement")
            
            return {
                'status': 'SUCCESS',
                'components': {
                    'trial_balance': True,
                    'profit_loss': True,
                    'balance_sheet': True,
                    'cash_flow': True
                },
                'sample_accounts': len(trial_balance['accounts']),
                'error': None
            }
            
        except Exception as e:
            print(f"  ❌ Financial reports failed: {str(e)}")
            return {
                'status': 'FAILED',
                'components': {
                    'trial_balance': False,
                    'profit_loss': False,
                    'balance_sheet': False,
                    'cash_flow': False
                },
                'error': str(e)
            }
    
    def validate_ml_anomaly_detection(self) -> Dict[str, Any]:
        """Validate ML anomaly detection system"""
        print("\n🤖 Validating ML anomaly detection...")
        
        try:
            from app.services.ml_anomaly_detector import MLAnomalyDetector
            
            detector = MLAnomalyDetector()
            
            # Test with sample financial data
            test_data = [
                {'amount': 1000, 'category': 'revenue', 'date': '2024-01-01'},
                {'amount': 500, 'category': 'expense', 'date': '2024-01-02'},
                {'amount': 1000000, 'category': 'revenue', 'date': '2024-01-03'},  # Anomaly
                {'amount': 750, 'category': 'expense', 'date': '2024-01-04'},
                {'amount': 1200, 'category': 'revenue', 'date': '2024-01-05'}
            ]
            
            result = detector.detect_anomalies(test_data)
            
            if not result or 'anomalies' not in result:
                raise Exception("Anomaly detection failed")
            
            print(f"  ✅ Anomaly detection (found {len(result['anomalies'])} anomalies)")
            print(f"  ✅ Processed {result['total_transactions']} transactions")
            
            return {
                'status': 'SUCCESS',
                'components': {
                    'anomaly_detection': True,
                    'model_initialization': True
                },
                'test_results': {
                    'total_transactions': result['total_transactions'],
                    'anomalies_found': len(result['anomalies']),
                    'anomaly_rate': result.get('anomaly_rate', 0)
                },
                'error': None
            }
            
        except Exception as e:
            print(f"  ❌ ML anomaly detection failed: {str(e)}")
            return {
                'status': 'FAILED',
                'components': {
                    'anomaly_detection': False,
                    'model_initialization': False
                },
                'error': str(e)
            }
    
    def validate_ai_orchestrator(self) -> Dict[str, Any]:
        """Validate AI orchestration system"""
        print("\n🧠 Validating AI orchestrator...")
        
        try:
            from app.services.ai_orchestrator import AIOrchestrator
            
            orchestrator = AIOrchestrator()
            
            # Test workflow list
            workflows = orchestrator.get_available_workflows()
            
            if not workflows:
                raise Exception("No workflows available")
            
            print(f"  ✅ AI orchestrator instantiation")
            print(f"  ✅ Available workflows: {len(workflows)}")
            
            return {
                'status': 'SUCCESS',
                'components': {
                    'orchestrator_init': True,
                    'workflow_listing': True
                },
                'available_workflows': len(workflows),
                'error': None
            }
            
        except Exception as e:
            print(f"  ❌ AI orchestrator failed: {str(e)}")
            return {
                'status': 'FAILED',
                'components': {
                    'orchestrator_init': False,
                    'workflow_listing': False
                },
                'error': str(e)
            }
    
    def validate_document_processor(self) -> Dict[str, Any]:
        """Validate document processing system"""
        print("\n📄 Validating document processor...")
        
        try:
            from app.services.document_processor import DocumentProcessor
            
            processor = DocumentProcessor()
            
            # Test processor instantiation
            supported_formats = processor.get_supported_formats()
            
            if not supported_formats:
                raise Exception("No supported formats found")
            
            print(f"  ✅ Document processor instantiation")
            print(f"  ✅ Supported formats: {', '.join(supported_formats)}")
            
            return {
                'status': 'SUCCESS',
                'components': {
                    'processor_init': True,
                    'format_support': True
                },
                'supported_formats': supported_formats,
                'error': None
            }
            
        except Exception as e:
            print(f"  ❌ Document processor failed: {str(e)}")
            return {
                'status': 'FAILED',
                'components': {
                    'processor_init': False,
                    'format_support': False
                },
                'error': str(e)
            }
    
    def generate_final_report(self) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        print("\n📋 Generating final validation report...")
        
        # Run all validations
        self.results['validation_results'] = {
            'core_imports': self.validate_core_imports(),
            'authentication': self.validate_authentication_system(),
            'compliance_engine': self.validate_compliance_engine(),
            'financial_reports': self.validate_financial_reports(),
            'ml_anomaly_detection': self.validate_ml_anomaly_detection(),
            'ai_orchestrator': self.validate_ai_orchestrator(),
            'document_processor': self.validate_document_processor()
        }
        
        # Calculate overall status
        successful_components = 0
        total_components = len(self.results['validation_results'])
        
        for component_name, component_result in self.results['validation_results'].items():
            if component_result.get('status') == 'SUCCESS':
                successful_components += 1
            else:
                # Add to critical issues
                self.results['critical_issues'].append({
                    'component': component_name,
                    'error': component_result.get('error', 'Unknown error')
                })
        
        success_rate = (successful_components / total_components) * 100
        
        if success_rate >= 85:
            self.results['overall_status'] = 'EXCELLENT'
        elif success_rate >= 70:
            self.results['overall_status'] = 'GOOD'
        elif success_rate >= 50:
            self.results['overall_status'] = 'MODERATE'
        else:
            self.results['overall_status'] = 'POOR'
        
        self.results['summary'] = {
            'total_components': total_components,
            'successful_components': successful_components,
            'success_rate': success_rate,
            'failed_components': total_components - successful_components
        }
        
        # Generate recommendations
        if success_rate < 100:
            self.results['recommendations'].append('Address critical issues to improve platform stability')
        
        if self.results['critical_issues']:
            self.results['recommendations'].append('Focus on failed components for production readiness')
        
        return self.results
    
    def print_summary(self):
        """Print validation summary"""
        print("\n" + "="*70)
        print("🎯 QRT CLOSURE PLATFORM - VALIDATION SUMMARY")
        print("="*70)
        
        summary = self.results['summary']
        print(f"📊 Overall Status: {self.results['overall_status']}")
        print(f"📈 Success Rate: {summary['success_rate']:.1f}%")
        print(f"✅ Successful Components: {summary['successful_components']}/{summary['total_components']}")
        
        if self.results['critical_issues']:
            print(f"\n❌ Critical Issues ({len(self.results['critical_issues'])}):")
            for issue in self.results['critical_issues']:
                print(f"  • {issue['component']}: {issue['error']}")
        
        if self.results['recommendations']:
            print(f"\n💡 Recommendations:")
            for rec in self.results['recommendations']:
                print(f"  • {rec}")
        
        print("\n" + "="*70)
        
        # Platform readiness assessment
        if summary['success_rate'] >= 85:
            print("🚀 PLATFORM STATUS: READY FOR PRODUCTION")
        elif summary['success_rate'] >= 70:
            print("⚠️  PLATFORM STATUS: READY FOR STAGING")
        elif summary['success_rate'] >= 50:
            print("🔧 PLATFORM STATUS: NEEDS DEVELOPMENT")
        else:
            print("❌ PLATFORM STATUS: CRITICAL ISSUES")
        
        print("="*70)

def main():
    """Main validation function"""
    print("🎯 QRT Closure Platform - Comprehensive Validation")
    print("=" * 70)
    
    validator = PlatformValidator()
    
    try:
        # Run comprehensive validation
        results = validator.generate_final_report()
        
        # Print summary
        validator.print_summary()
        
        # Save detailed results
        with open('validation_report.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print("\n📄 Detailed report saved to: validation_report.json")
        
        # Return success code based on results
        success_rate = results['summary']['success_rate']
        if success_rate >= 70:
            return 0
        else:
            return 1
            
    except Exception as e:
        print(f"\n❌ Validation failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())