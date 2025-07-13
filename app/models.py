"""
SQLAlchemy models for the QRT Closure platform
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey, Enum
from sqlalchemy.types import DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    profile_image_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    documents = relationship("Document", back_populates="uploader")
    audit_trails = relationship("AuditTrail", back_populates="user")
    compliance_checks = relationship("ComplianceCheck", back_populates="checker")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    file_type = Column(String)
    file_size = Column(Integer)
    file_path = Column(String)
    document_type = Column(String)
    status = Column(String, default="uploaded")
    extracted_data = Column(JSON)
    processed_at = Column(DateTime)
    uploaded_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    uploader = relationship("User", back_populates="documents")
    agent_jobs = relationship("AgentJob", back_populates="document")
    journal_entries = relationship("JournalEntry", back_populates="document")
    compliance_checks = relationship("ComplianceCheck", back_populates="document")

class AgentJob(Base):
    __tablename__ = "agent_jobs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"))
    agent_type = Column(String)
    status = Column(String, default="pending")
    input_data = Column(JSON)
    output_data = Column(JSON)
    error_message = Column(Text)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="agent_jobs")

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"))
    entry_date = Column(DateTime)
    reference_number = Column(String)
    description = Column(Text)
    account_code = Column(String)
    account_name = Column(String)
    debit_amount = Column(DECIMAL(precision=15, scale=2))
    credit_amount = Column(DECIMAL(precision=15, scale=2))
    entity = Column(String)
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="journal_entries")
    creator = relationship("User")

class FinancialStatement(Base):
    __tablename__ = "financial_statements"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    statement_type = Column(String)  # trial_balance, profit_loss, balance_sheet, cash_flow
    period = Column(String)
    data = Column(JSON)
    generated_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    generator = relationship("User")

class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"))
    check_type = Column(String)
    result = Column(String)
    score = Column(DECIMAL(precision=5, scale=2))
    violations = Column(JSON)
    recommendations = Column(JSON)
    checked_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="compliance_checks")
    checker = relationship("User", back_populates="compliance_checks")

class AuditTrail(Base):
    __tablename__ = "audit_trail"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String)
    entity_type = Column(String)
    entity_id = Column(String)
    details = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="audit_trails")

class ReconciliationRule(Base):
    __tablename__ = "reconciliation_rules"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)
    description = Column(Text)
    entity_pairs = Column(JSON)
    account_codes = Column(JSON)
    tolerance_percent = Column(DECIMAL(precision=5, scale=4), default=0.01)
    tolerance_amount = Column(DECIMAL(precision=15, scale=2), default=100.00)
    auto_reconcile = Column(Boolean, default=False)
    priority = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ReconciliationMatch(Base):
    __tablename__ = "reconciliation_matches"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_a = Column(String)
    entity_b = Column(String)
    transaction_a_id = Column(String, ForeignKey("journal_entries.id"))
    transaction_b_id = Column(String, ForeignKey("journal_entries.id"))
    match_score = Column(DECIMAL(precision=5, scale=4))
    match_type = Column(String)  # exact, partial, suspected
    variance = Column(DECIMAL(precision=15, scale=2), default=0.00)
    variance_reasons = Column(JSON)
    reconciliation_date = Column(DateTime)
    status = Column(String, default="matched")
    rule_id = Column(String, ForeignKey("reconciliation_rules.id"))
    period = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class IntercompanyTransaction(Base):
    __tablename__ = "intercompany_transactions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    parent_entity = Column(String)
    child_entity = Column(String)
    transaction_type = Column(String)
    amount = Column(DECIMAL(precision=15, scale=2))
    currency = Column(String, default="INR")
    transaction_date = Column(DateTime)
    description = Column(Text)
    document_ids = Column(JSON)
    is_reconciled = Column(Boolean, default=False)
    reconciliation_id = Column(String, ForeignKey("reconciliation_matches.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ML Anomaly Detection Models
class AnomalyDetectionModel(Base):
    __tablename__ = "anomaly_detection_models"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_name = Column(String, nullable=False)
    model_type = Column(String)  # isolation_forest, one_class_svm, etc.
    version = Column(String)
    parameters = Column(JSON)
    training_data_size = Column(Integer)
    training_date = Column(DateTime)
    performance_metrics = Column(JSON)
    model_file_path = Column(String)
    is_active = Column(Boolean, default=True)
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User")
    anomaly_results = relationship("AnomalyDetectionResult", back_populates="model")

class AnomalyDetectionResult(Base):
    __tablename__ = "anomaly_detection_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, ForeignKey("anomaly_detection_models.id"))
    transaction_id = Column(String)
    document_id = Column(String, ForeignKey("documents.id"))
    anomaly_score = Column(DECIMAL(precision=10, scale=6))
    is_anomaly = Column(Boolean)
    confidence_level = Column(DECIMAL(precision=5, scale=4))
    anomaly_reasons = Column(JSON)
    detection_method = Column(String)
    features_used = Column(JSON)
    model_version = Column(String)
    detected_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by = Column(String, ForeignKey("users.id"))
    review_status = Column(String, default="pending")  # pending, confirmed, false_positive
    review_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("AnomalyDetectionModel", back_populates="anomaly_results")
    document = relationship("Document")
    reviewer = relationship("User")

class ModelPerformanceMetric(Base):
    __tablename__ = "model_performance_metrics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, ForeignKey("anomaly_detection_models.id"))
    metric_name = Column(String)
    metric_value = Column(DECIMAL(precision=10, scale=6))
    metric_type = Column(String)  # accuracy, precision, recall, f1_score, etc.
    measurement_date = Column(DateTime)
    samples_processed = Column(Integer)
    anomalies_detected = Column(Integer)
    processing_time_ms = Column(DECIMAL(precision=10, scale=2))
    data_window = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("AnomalyDetectionModel")

class DataDriftMetric(Base):
    __tablename__ = "data_drift_metrics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    feature_name = Column(String)
    drift_score = Column(DECIMAL(precision=10, scale=6))
    drift_threshold = Column(DECIMAL(precision=10, scale=6))
    is_drift_detected = Column(Boolean)
    drift_type = Column(String)  # mean, variance, distribution
    statistical_test = Column(String)
    p_value = Column(DECIMAL(precision=10, scale=6))
    reference_period = Column(String)
    current_period = Column(String)
    detection_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class ModelAlert(Base):
    __tablename__ = "model_alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_type = Column(String)  # performance, drift, error, anomaly_rate
    severity = Column(String)    # low, medium, high, critical
    model_id = Column(String, ForeignKey("anomaly_detection_models.id"))
    metric_name = Column(String)
    current_value = Column(DECIMAL(precision=10, scale=6))
    threshold_value = Column(DECIMAL(precision=10, scale=6))
    description = Column(Text)
    recommendation = Column(Text)
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(String, ForeignKey("users.id"))
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("AnomalyDetectionModel")
    resolver = relationship("User")

class FeatureImportance(Base):
    __tablename__ = "feature_importance"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, ForeignKey("anomaly_detection_models.id"))
    feature_name = Column(String)
    importance_score = Column(DECIMAL(precision=10, scale=6))
    rank = Column(Integer)
    category = Column(String)
    description = Column(Text)
    calculation_method = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("AnomalyDetectionModel")