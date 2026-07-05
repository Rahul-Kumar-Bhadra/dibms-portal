from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str

class UserCreate(UserBase):
    password: str
    plant_id: Optional[str] = None

class UserOut(UserBase):
    id: str
    plant_id: Optional[str] = None
    plant_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Plant Schemas
class PlantBase(BaseModel):
    id: str
    name: str
    state: str
    location: str
    region: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    status: Optional[str] = "active"

class PlantCreate(PlantBase):
    pass

class PlantOut(PlantBase):
    created_at: datetime

    class Config:
        from_attributes = True

# Workforce/Employee Schemas
class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    department: str
    designation: str
    status: Optional[str] = "active"

class EmployeeCreate(EmployeeBase):
    plant_id: str

class EmployeeOut(EmployeeBase):
    id: str
    plant_id: str
    plant_name: Optional[str] = None
    joining_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

# Operations Report Schemas
class OperationsReportBase(BaseModel):
    year: int
    month: int = Field(..., ge=1, le=12)
    revenue: float
    expenses: float
    production_units: int
    attendance_rate: float = Field(..., ge=0, le=100)
    safety_incidents: int = Field(default=0, ge=0)
    quality_score: float = Field(..., ge=0, le=100)
    remarks: Optional[str] = None

class OperationsReportCreate(OperationsReportBase):
    plant_id: str

class OperationsReportOut(OperationsReportBase):
    id: str
    plant_id: str
    plant_name: Optional[str] = None
    status: str
    submitted_by: Optional[str] = None
    submitted_by_name: Optional[str] = None
    submitted_at: datetime

    class Config:
        from_attributes = True

# Document Schemas
class DocumentBase(BaseModel):
    file_name: str
    file_type: str
    file_size: int
    category: Optional[str] = "SOP"

class DocumentOut(DocumentBase):
    id: str
    plant_id: str
    plant_name: Optional[str] = None
    file_path: str
    uploaded_by: Optional[str] = None
    uploaded_by_name: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    type: Optional[str] = "info"
    plant_id: Optional[str] = None

class NotificationOut(NotificationBase):
    id: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Audit Log Schemas
class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# EEIM (Enterprise Excel Intelligence Module) Schemas
class ValidationIssue(BaseModel):
    row: Optional[int] = None
    column: Optional[str] = None
    value: Optional[str] = None
    rule: str

class ValidationReport(BaseModel):
    status: str # SUCCESS, WARNINGS, FAILED
    file_name: str
    total_errors: int
    total_warnings: int
    errors: List[ValidationIssue]
    warnings: List[ValidationIssue]
    parsed_data: Optional[Dict[str, Any]] = None # Preview of extracted data
    upload_id: Optional[str] = None # ID in UploadHistory

class ConfirmUploadRequest(BaseModel):
    upload_id: str

class UploadHistoryOut(BaseModel):
    id: str
    plant_id: str
    year: int
    month: int
    file_name: str
    status: str
    validation_score: Optional[float] = None
    uploaded_by: Optional[str] = None
    uploaded_by_name: Optional[str] = None
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

# Aggregated Stats for Admin Dashboard
class DashboardStatsAdmin(BaseModel):
    total_plants: int
    total_employees: int
    reports_submitted: int
    pending_reports: int
    total_revenue: float
    total_production: int
    revenue_trend: List[Dict[str, Any]]
    plant_comparison: List[Dict[str, Any]]
    employee_distribution: List[Dict[str, Any]]
    recent_activities: List[Dict[str, Any]]
    pending_reports_list: List[Dict[str, Any]]
    recent_uploads: List[Dict[str, Any]]
    pending_month: int
    pending_month_name: str
    pending_year: int

# Aggregated Stats for Plant Dashboard
class DashboardStatsPlant(BaseModel):
    plant_id: str
    plant_name: str
    total_employees: int
    reports_submitted: int
    pending_reports: int
    monthly_revenue: float
    average_attendance: float
    recent_activities: List[Dict[str, Any]]
    pending_month: int
    pending_month_name: str
    pending_year: int
