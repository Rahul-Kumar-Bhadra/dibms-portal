from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta

from app.api import deps
from app.models import Plant, Employee, OperationsReport, PlantDocument, User, AuditLog
from app.schemas import DashboardStatsAdmin, DashboardStatsPlant

router = APIRouter()

MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

def get_pending_period():
    now = datetime.now()
    if now.month == 1:
        return 12, now.year - 1
    return now.month - 1, now.year

@router.get("/admin", response_model=DashboardStatsAdmin, dependencies=[Depends(deps.RoleChecker(["Enterprise Admin"]))])
def get_admin_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    # 1. Basic counts
    total_plants = db.query(Plant).count()
    total_employees = db.query(Employee).count()
    
    # 2. Dynamic latest month (previous calendar month)
    pending_month, pending_year = get_pending_period()
    pending_month_name = MONTH_NAMES[pending_month]
    
    reports_submitted = db.query(OperationsReport).filter(
        and_(OperationsReport.year == pending_year, OperationsReport.month == pending_month)
    ).count()
    
    pending_reports = max(0, total_plants - reports_submitted)
    
    # 3. Sum of all reports in our DB
    total_revenue = db.query(func.sum(OperationsReport.revenue)).scalar() or 0.0
    total_production = db.query(func.sum(OperationsReport.production_units)).scalar() or 0
    
    # 4. Revenue Trend (last 6 months dynamically calculated)
    now = datetime.now()
    months_list = []
    temp_date = now.replace(day=1)
    for _ in range(6):
        temp_date = temp_date - timedelta(days=1)
        months_list.append((temp_date.year, temp_date.month))
    months_list.reverse() # Sort chronological
    
    revenue_trend = []
    for y, m in months_list:
        sums = db.query(
            func.sum(OperationsReport.revenue).label("revenue"),
            func.sum(OperationsReport.expenses).label("expenses")
        ).filter(and_(OperationsReport.year == y, OperationsReport.month == m)).first()
        
        revenue_trend.append({
            "month": f"{MONTH_NAMES[m]} {y % 100}",
            "revenue": round(sums.revenue, 2) if sums and sums.revenue else 0.0,
            "expenses": round(sums.expenses, 2) if sums and sums.expenses else 0.0
        })
        
    # 5. Plant Comparison (data for the pending month)
    plant_comparison = []
    latest_reports = db.query(OperationsReport).filter(
        and_(OperationsReport.year == pending_year, OperationsReport.month == pending_month)
    ).all()
    
    for r in latest_reports:
        plant_comparison.append({
            "plant": r.plant.location,
            "revenue": round(r.revenue, 2),
            "quality": r.quality_score,
            "production": r.production_units
        })
        
    # 6. Employee distribution by department
    employee_distribution = []
    dept_counts = db.query(
        Employee.department,
        func.count(Employee.id).label("count")
    ).group_by(Employee.department).all()
    
    for dept, count in dept_counts:
        employee_distribution.append({
            "name": dept,
            "value": count
        })
        
    # 7. Recent activities
    recent_activities = []
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(8).all()
    for log in logs:
        user_email = log.user.email if log.user else "System"
        recent_activities.append({
            "id": log.id,
            "user": user_email,
            "action": log.action,
            "details": log.details,
            "time": log.created_at.isoformat()
        })
        
    # 8. Pending Reports list
    submitted_plant_ids = [r.plant_id for r in latest_reports]
    pending_plants = db.query(Plant).filter(~Plant.id.in_(submitted_plant_ids)).all()
    pending_reports_list = []
    for pp in pending_plants:
        pending_reports_list.append({
            "branch_id": pp.id,  # Keep key as branch_id or plant_id for frontend transition ease
            "plant_id": pp.id,
            "branch_name": pp.name,
            "plant_name": pp.name,
            "state": pp.state,
            "contact": pp.contact_email
        })
        
    # 9. Recent uploads
    recent_uploads = []
    docs = db.query(PlantDocument).order_by(PlantDocument.uploaded_at.desc()).limit(5).all()
    for d in docs:
        recent_uploads.append({
            "id": d.id,
            "file_name": d.file_name,
            "branch_name": d.plant.name,
            "plant_name": d.plant.name,
            "uploaded_at": d.uploaded_at.isoformat()
        })
        
    return {
        "total_plants": total_plants,
        "total_employees": total_employees,
        "reports_submitted": reports_submitted,
        "pending_reports": pending_reports,
        "total_revenue": total_revenue,
        "total_production": total_production,
        "revenue_trend": revenue_trend,
        "plant_comparison": plant_comparison,
        "employee_distribution": employee_distribution,
        "recent_activities": recent_activities,
        "pending_reports_list": pending_reports_list,
        "recent_uploads": recent_uploads,
        "pending_month": pending_month,
        "pending_month_name": pending_month_name,
        "pending_year": pending_year
    }

@router.get("/branch", response_model=DashboardStatsPlant, dependencies=[Depends(deps.RoleChecker(["Plant Manager"]))])
def get_plant_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    plant_id = current_user.plant_id
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    
    total_employees = db.query(Employee).filter(Employee.plant_id == plant_id).count()
    reports_submitted = db.query(OperationsReport).filter(OperationsReport.plant_id == plant_id).count()
    
    pending_month, pending_year = get_pending_period()
    pending_month_name = MONTH_NAMES[pending_month]
    
    latest_report = db.query(OperationsReport).filter(
        and_(
            OperationsReport.plant_id == plant_id,
            OperationsReport.year == pending_year,
            OperationsReport.month == pending_month
        )
    ).first()
    
    pending_reports = 0 if latest_report else 1
    monthly_revenue = latest_report.revenue if latest_report else 0.0
    
    avg_attendance = db.query(func.avg(OperationsReport.attendance_rate)).filter(
        OperationsReport.plant_id == plant_id
    ).scalar() or 0.0
    
    recent_activities = []
    logs = db.query(AuditLog).filter(AuditLog.user_id == current_user.id).order_by(AuditLog.created_at.desc()).limit(5).all()
    for log in logs:
        recent_activities.append({
            "id": log.id,
            "action": log.action,
            "details": log.details,
            "time": log.created_at.isoformat()
        })
        
    return {
        "plant_id": plant_id,
        "plant_name": plant.name if plant else "Unknown Plant",
        "total_employees": total_employees,
        "reports_submitted": reports_submitted,
        "pending_reports": pending_reports,
        "monthly_revenue": monthly_revenue,
        "average_attendance": round(avg_attendance, 2),
        "recent_activities": recent_activities,
        "pending_month": pending_month,
        "pending_month_name": pending_month_name,
        "pending_year": pending_year
    }
