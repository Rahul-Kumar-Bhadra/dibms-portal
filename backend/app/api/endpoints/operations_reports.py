from typing import Any, List, Optional
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.api import deps
from app.models import OperationsReport, Plant, User, AuditLog, Notification, UploadHistory
from app.schemas import (
    OperationsReportOut, 
    OperationsReportCreate, 
    ValidationReport, 
    ConfirmUploadRequest,
    UploadHistoryOut
)
from app.services.template_generator import generate_plant_template
from app.services.excel_parser import parse_excel
from app.services.validation_pipeline import validate_excel_data
import hashlib

router = APIRouter()

MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

@router.get("/", response_model=List[OperationsReportOut])
def read_reports(
    plant_id: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    query = db.query(OperationsReport)
    
    # RBAC check: Plant Managers are restricted to their own plant
    if current_user.role == "Plant Manager":
        query = query.filter(OperationsReport.plant_id == current_user.plant_id)
    elif plant_id:
        query = query.filter(OperationsReport.plant_id == plant_id)
        
    if year:
        query = query.filter(OperationsReport.year == year)
    if month:
        query = query.filter(OperationsReport.month == month)
        
    reports = query.all()
    
    # Populate extra fields
    for r in reports:
        r.plant_name = r.plant.name
        if r.submitted_by:
            sub_user = db.query(User).filter(User.id == r.submitted_by).first()
            if sub_user:
                r.submitted_by_name = f"{sub_user.first_name or ''} {sub_user.last_name or ''}".strip() or sub_user.email
            else:
                r.submitted_by_name = "Unknown"
        else:
            r.submitted_by_name = "System"
            
    return reports

@router.post("/", response_model=OperationsReportOut)
def create_report(
    report_in: OperationsReportCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    # RBAC check
    if current_user.role == "Plant Manager" and report_in.plant_id != current_user.plant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit reports for your own manufacturing plant."
        )
        
    plant = db.query(Plant).filter(Plant.id == report_in.plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
        
    # Check if report already exists for this plant/year/month
    existing = db.query(OperationsReport).filter(
        and_(
            OperationsReport.plant_id == report_in.plant_id,
            OperationsReport.year == report_in.year,
            OperationsReport.month == report_in.month
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An operations report already exists for {report_in.month}/{report_in.year}."
        )
        
    report = OperationsReport(
        **report_in.model_dump(),
        status="Submitted",
        submitted_by=current_user.id
    )
    db.add(report)
    
    # Create notification for Enterprise Admins
    month_name = MONTH_NAMES[report_in.month] if 1 <= report_in.month <= 12 else str(report_in.month)
    
    notif = Notification(
        title=f"New Operations Report Submitted",
        message=f"{plant.name} submitted their operations report for {month_name} {report_in.year}.",
        type="report",
        plant_id=None
    )
    db.add(notif)
    
    # Business Rules & QA/EHS Threshold checks
    if report.quality_score < 90.0:
        qa_notif = Notification(
            title="Critical Quality Warning",
            message=f"Plant {plant.name} reported a Quality Score of {report.quality_score}%, which is below the 90% enterprise threshold.",
            type="alert",
            plant_id=plant.id
        )
        db.add(qa_notif)
        
    if report.safety_incidents > 0:
        ehs_notif = Notification(
            title="Critical EHS Incident Logged",
            message=f"Plant {plant.name} reported {report.safety_incidents} safety incident(s) for the month of {month_name}.",
            type="alert",
            plant_id=plant.id
        )
        db.add(ehs_notif)
    
    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        action="Submit Operations Report",
        details=f"Submitted operations report for plant {report_in.plant_id} for period {report_in.month}/{report_in.year}."
    ))
    db.commit()
    db.refresh(report)
    
    report.plant_name = plant.name
    report.submitted_by_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email
    return report

@router.post("/{report_id}/approve", response_model=OperationsReportOut, dependencies=[Depends(deps.RoleChecker(["Enterprise Admin"]))])
def approve_report(
    report_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    report = db.query(OperationsReport).filter(OperationsReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Operations report not found")
        
    report.status = "Approved"
    db.add(report)
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="Approve Operations Report",
        details=f"Approved operations report {report_id} for plant {report.plant_id}."
    ))
    db.commit()
    db.refresh(report)
    
    report.plant_name = report.plant.name
    return report

@router.post("/{report_id}/reject", response_model=OperationsReportOut, dependencies=[Depends(deps.RoleChecker(["Enterprise Admin"]))])
def reject_report(
    report_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    report = db.query(OperationsReport).filter(OperationsReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Operations report not found")
        
    report.status = "Rejected"
    db.add(report)
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="Reject Operations Report",
        details=f"Rejected operations report {report_id} for plant {report.plant_id}."
    ))
    db.commit()
    db.refresh(report)
    
    report.plant_name = report.plant.name
    return report

@router.get("/compare", response_model=List[OperationsReportOut], dependencies=[Depends(deps.RoleChecker(["Enterprise Admin"]))])
def compare_reports(
    year: int,
    month: int,
    db: Session = Depends(deps.get_db)
) -> Any:
    reports = db.query(OperationsReport).filter(
        and_(
            OperationsReport.year == year,
            OperationsReport.month == month
        )
    ).all()
    
    for r in reports:
        r.plant_name = r.plant.name
        if r.submitted_by:
            sub_user = db.query(User).filter(User.id == r.submitted_by).first()
            if sub_user:
                r.submitted_by_name = f"{sub_user.first_name or ''} {sub_user.last_name or ''}".strip() or sub_user.email
            else:
                r.submitted_by_name = "Unknown"
        else:
            r.submitted_by_name = "System"
            
    return reports

@router.get("/{report_id}", response_model=OperationsReportOut)
def read_report(
    report_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    report = db.query(OperationsReport).filter(OperationsReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Operations report not found")
        
    if current_user.role == "Plant Manager" and report.plant_id != current_user.plant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot view reports of other manufacturing plants."
        )
        
    report.plant_name = report.plant.name
    if report.submitted_by:
        sub_user = db.query(User).filter(User.id == report.submitted_by).first()
        report.submitted_by_name = f"{sub_user.first_name or ''} {sub_user.last_name or ''}".strip() if sub_user else "Unknown"
    else:
        report.submitted_by_name = "System"
        
    return report

# ---------------------------------------------------------
# EEIM (Enterprise Excel Intelligence Module) Endpoints
# ---------------------------------------------------------

@router.get("/template/download")
def download_template(
    month: int,
    year: int,
    plant_id: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Generate and download a personalized Excel template for the plant manager.
    """
    target_plant_id = plant_id
    if current_user.role == "Plant Manager":
        target_plant_id = current_user.plant_id
        
    if not target_plant_id:
        raise HTTPException(status_code=400, detail="Plant ID is required.")
        
    plant = db.query(Plant).filter(Plant.id == target_plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found.")
        
    manager_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email
    
    excel_io = generate_plant_template(
        plant_id=plant.id,
        plant_name=plant.name,
        month=month,
        year=year,
        manager_name=manager_name
    )
    
    filename = f"DIBMS_Template_{plant.id}_{year}_{month:02d}.xlsx"
    
    return StreamingResponse(
        excel_io, 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/upload", response_model=ValidationReport)
def upload_excel_report(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Upload an Excel file, parse it, validate against business rules, and return a preview.
    Does NOT save to operations_reports yet.
    """
    if current_user.role != "Plant Manager" or not current_user.plant_id:
        raise HTTPException(status_code=403, detail="Only assigned Plant Managers can upload reports.")
        
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported.")
        
    # Read file content
    content = file.file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Check if duplicate file content was already uploaded successfully
    duplicate = db.query(UploadHistory).filter(
        UploadHistory.file_hash == file_hash,
        UploadHistory.status == "Success"
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="This exact file has already been uploaded and processed.")
    
    # Save file to disk
    plant_dir = f"uploads/excel/{current_user.plant_id}"
    os.makedirs(plant_dir, exist_ok=True)
    file_path = os.path.join(plant_dir, f"{file_hash[:8]}_{file.filename}")
    
    with open(file_path, "wb") as f:
        f.write(content)
        
    # 1. Parse Excel
    try:
        metadata, raw_data = parse_excel(content)
    except ValueError as e:
        # Log failure
        history = UploadHistory(
            plant_id=current_user.plant_id,
            year=0, month=0,
            file_name=file.filename,
            file_path=file_path,
            file_hash=file_hash,
            status="Failed",
            uploaded_by=current_user.id
        )
        db.add(history)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))
        
    # 2. Check duplicate submission for the same month/year
    # User preference: reject duplicates for now
    existing_report = db.query(OperationsReport).filter(
        OperationsReport.plant_id == current_user.plant_id,
        OperationsReport.year == metadata.get("year", 0),
        OperationsReport.month == metadata.get("month", 0)
    ).first()
    
    if existing_report:
        # Create rejected history
        history = UploadHistory(
            plant_id=current_user.plant_id,
            year=metadata.get("year", 0),
            month=metadata.get("month", 0),
            file_name=file.filename,
            file_path=file_path,
            file_hash=file_hash,
            status="Rejected",
            uploaded_by=current_user.id
        )
        db.add(history)
        db.commit()
        raise HTTPException(
            status_code=400, 
            detail=f"A report for {metadata.get('month')}/{metadata.get('year')} has already been submitted. Overwrites are not currently permitted."
        )
        
    # 3. Run Validation Pipeline
    report, score = validate_excel_data(
        file_name=file.filename,
        metadata=metadata,
        data=raw_data,
        expected_plant_id=current_user.plant_id
    )
    
    # 4. Save to UploadHistory as Pending
    history = UploadHistory(
        plant_id=current_user.plant_id,
        year=metadata.get("year", 0),
        month=metadata.get("month", 0),
        file_name=file.filename,
        file_path=file_path,
        file_hash=file_hash,
        status="Pending",
        validation_score=score,
        uploaded_by=current_user.id
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    
    # Attach the history ID so the client can confirm it
    report.upload_id = history.id
    return report

@router.post("/confirm", response_model=OperationsReportOut)
def confirm_upload(
    req: ConfirmUploadRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Confirm the preview data from an upload and insert it into the database.
    """
    history = db.query(UploadHistory).filter(UploadHistory.id == req.upload_id).first()
    if not history:
        raise HTTPException(status_code=404, detail="Upload session not found.")
        
    if history.status != "Pending":
        raise HTTPException(status_code=400, detail=f"Upload session is {history.status}, not Pending.")
        
    if current_user.role == "Plant Manager" and history.plant_id != current_user.plant_id:
        raise HTTPException(status_code=403, detail="Not authorized for this upload.")
        
    # Re-parse the saved file to get the data
    try:
        with open(history.file_path, "rb") as f:
            content = f.read()
        metadata, raw_data = parse_excel(content)
        report_val, _ = validate_excel_data(history.file_name, metadata, raw_data, history.plant_id)
        if report_val.status == "FAILED":
            raise ValueError("File validation failed upon re-check.")
    except Exception as e:
        history.status = "Failed"
        db.commit()
        raise HTTPException(status_code=400, detail=f"Could not process confirmed file: {str(e)}")
        
    parsed_data = report_val.parsed_data
    
    # Create the Operations Report
    report = OperationsReport(
        plant_id=history.plant_id,
        year=parsed_data["year"],
        month=parsed_data["month"],
        revenue=parsed_data["revenue"],
        expenses=parsed_data["expenses"],
        production_units=parsed_data["production_units"],
        attendance_rate=parsed_data["attendance_rate"],
        safety_incidents=parsed_data["safety_incidents"],
        quality_score=parsed_data["quality_score"],
        remarks="Uploaded via Enterprise Excel Integration",
        status="Submitted",
        submitted_by=current_user.id
    )
    db.add(report)
    
    # Update History
    history.status = "Success"
    
    # Create notifications and audit logs
    plant = db.query(Plant).filter(Plant.id == history.plant_id).first()
    month_name = MONTH_NAMES[parsed_data["month"]] if 1 <= parsed_data["month"] <= 12 else str(parsed_data["month"])
    
    db.add(Notification(
        title=f"New Operations Report Uploaded",
        message=f"{plant.name} uploaded their operations report via Excel for {month_name} {parsed_data['year']}.",
        type="report"
    ))
    
    if parsed_data["quality_score"] < 90.0:
        db.add(Notification(
            title="Critical Quality Warning",
            message=f"Plant {plant.name} reported a Quality Score of {parsed_data['quality_score']}% via upload, which is below the 90% threshold.",
            type="alert",
            plant_id=plant.id
        ))
        
    if parsed_data["safety_incidents"] > 0:
        db.add(Notification(
            title="Critical EHS Incident Logged",
            message=f"Plant {plant.name} reported {parsed_data['safety_incidents']} safety incident(s) for {month_name} via upload.",
            type="alert",
            plant_id=plant.id
        ))
        
    db.add(AuditLog(
        user_id=current_user.id,
        action="Upload Excel Report",
        details=f"Successfully uploaded and confirmed operations report for {month_name} {parsed_data['year']}."
    ))
    
    db.commit()
    db.refresh(report)
    
    report.plant_name = plant.name
    report.submitted_by_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email
    
    return report

@router.get("/history/uploads", response_model=List[UploadHistoryOut])
def get_upload_history(
    plant_id: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get the history of Excel uploads.
    """
    query = db.query(UploadHistory)
    
    if current_user.role == "Plant Manager":
        query = query.filter(UploadHistory.plant_id == current_user.plant_id)
    elif plant_id:
        query = query.filter(UploadHistory.plant_id == plant_id)
        
    # Order by newest first
    histories = query.order_by(UploadHistory.uploaded_at.desc()).all()
    
    for h in histories:
        if h.uploaded_by:
            sub_user = db.query(User).filter(User.id == h.uploaded_by).first()
            if sub_user:
                h.uploaded_by_name = f"{sub_user.first_name or ''} {sub_user.last_name or ''}".strip() or sub_user.email
    
    return histories

@router.delete("/plant/{plant_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(deps.RoleChecker(["Enterprise Admin"]))])
def delete_plant_reports(
    plant_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Delete all operations reports and upload history for a specific plant.
    Only accessible by Enterprise Admin.
    """
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
        
    deleted_reports = db.query(OperationsReport).filter(OperationsReport.plant_id == plant_id).delete()
    deleted_uploads = db.query(UploadHistory).filter(UploadHistory.plant_id == plant_id).delete()
    
    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        action="Delete Plant Reports",
        details=f"Deleted all operations reports ({deleted_reports}) and uploads ({deleted_uploads}) for plant {plant_id}."
    ))
    db.commit()
    
    return {
        "message": f"Successfully deleted {deleted_reports} reports and {deleted_uploads} upload records for plant {plant_id} ({plant.name})."
    }
