import uuid
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class Plant(Base):
    __tablename__ = "plants"
    
    id = Column(String, primary_key=True, index=True) # PL001, PL002...
    name = Column(String, nullable=False)
    state = Column(String, nullable=False)
    location = Column(String, nullable=False)
    region = Column(String, nullable=False) # North, South, West, East
    contact_email = Column(String, nullable=False)
    contact_phone = Column(String, nullable=True)
    status = Column(String, default="active") # active, inactive
    created_at = Column(DateTime, default=get_utc_now)
    
    # Relationships
    users = relationship("User", back_populates="plant", cascade="all, delete-orphan")
    workforce = relationship("Employee", back_populates="plant", cascade="all, delete-orphan")
    reports = relationship("OperationsReport", back_populates="plant", cascade="all, delete-orphan")
    documents = relationship("PlantDocument", back_populates="plant", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False) # "Enterprise Admin", "Plant Manager"
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    plant_id = Column(String, ForeignKey("plants.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    
    # Relationships
    plant = relationship("Plant", back_populates="users")
    uploaded_documents = relationship("PlantDocument", back_populates="uploader")
    audit_logs = relationship("AuditLog", back_populates="user")

class Employee(Base):
    __tablename__ = "workforce"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    plant_id = Column(String, ForeignKey("plants.id", ondelete="CASCADE"), nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    department = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    status = Column(String, default="active") # active, inactive
    joining_date = Column(DateTime, default=get_utc_now)
    created_at = Column(DateTime, default=get_utc_now)
    
    # Relationships
    plant = relationship("Plant", back_populates="workforce")

class OperationsReport(Base):
    __tablename__ = "operations_reports"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    plant_id = Column(String, ForeignKey("plants.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False) # 1-12
    revenue = Column(Float, nullable=False)
    expenses = Column(Float, nullable=False)
    production_units = Column(Integer, nullable=False)
    attendance_rate = Column(Float, nullable=False) # percentage
    safety_incidents = Column(Integer, default=0)
    quality_score = Column(Float, nullable=False) # e.g. 0-100
    remarks = Column(Text, nullable=True)
    status = Column(String, default="Submitted") # Submitted, Approved, Rejected
    submitted_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    submitted_at = Column(DateTime, default=get_utc_now)
    
    # Relationships
    plant = relationship("Plant", back_populates="reports")

class PlantDocument(Base):
    __tablename__ = "plant_documents"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    plant_id = Column(String, ForeignKey("plants.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False) # PDF, Excel, Image
    file_size = Column(Integer, nullable=False) # in bytes
    category = Column(String, default="SOP") # SOP, EH&S Compliance, Equipment Calibration, Financial Audit
    uploaded_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime, default=get_utc_now)
    
    # Relationships
    plant = relationship("Plant", back_populates="documents")
    uploader = relationship("User", back_populates="uploaded_documents")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info") # alert, announcement, report, info
    plant_id = Column(String, ForeignKey("plants.id", ondelete="CASCADE"), nullable=True) # Nullable means broadcast
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False) # Login, Submit Report, Add Employee, etc.
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

class UploadHistory(Base):
    __tablename__ = "upload_history"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    plant_id = Column(String, ForeignKey("plants.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)
    status = Column(String, default="Pending") # Pending, Success, Rejected
    validation_score = Column(Float, nullable=True) # e.g. 100.0
    uploaded_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime, default=get_utc_now)
    
    # Relationships
    plant = relationship("Plant")
    uploader = relationship("User")
