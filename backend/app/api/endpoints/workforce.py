from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.api import deps
from app.models import Employee, Plant, User, AuditLog
from app.schemas import EmployeeOut, EmployeeCreate

router = APIRouter()

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[str] = None
    plant_id: Optional[str] = None

@router.get("/", response_model=List[EmployeeOut])
def read_workforce(
    plant_id: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    query = db.query(Employee)
    
    # RBAC filtering: Plant Managers are restricted to their own plant
    if current_user.role == "Plant Manager":
        query = query.filter(Employee.plant_id == current_user.plant_id)
    elif plant_id:
        query = query.filter(Employee.plant_id == plant_id)
        
    employees = query.all()
    # Populate plant_name
    for emp in employees:
        emp.plant_name = emp.plant.name
        
    return employees

@router.get("/{employee_id}", response_model=EmployeeOut)
def read_employee(
    employee_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Workforce personnel not found")
        
    if current_user.role == "Plant Manager" and employee.plant_id != current_user.plant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot view details of workforce personnel in other manufacturing plants."
        )
        
    employee.plant_name = employee.plant.name
    return employee

@router.post("/", response_model=EmployeeOut)
def create_employee(
    employee_in: EmployeeCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    if current_user.role == "Plant Manager" and employee_in.plant_id != current_user.plant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only add workforce personnel to your own manufacturing plant."
        )
        
    plant = db.query(Plant).filter(Plant.id == employee_in.plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
        
    employee = Employee(**employee_in.model_dump())
    db.add(employee)
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="Create Workforce",
        details=f"Added workforce personnel {employee_in.first_name} {employee_in.last_name} to plant {employee_in.plant_id}."
    ))
    db.commit()
    db.refresh(employee)
    employee.plant_name = plant.name
    return employee

@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: str,
    employee_in: EmployeeUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Workforce personnel not found")
        
    if current_user.role == "Plant Manager" and employee.plant_id != current_user.plant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify workforce personnel in your own plant."
        )
        
    update_data = employee_in.model_dump(exclude_unset=True)
    if "plant_id" in update_data and update_data["plant_id"] != employee.plant_id:
        if current_user.role == "Plant Manager":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot move workforce personnel to another manufacturing plant."
            )
        target_plant = db.query(Plant).filter(Plant.id == update_data["plant_id"]).first()
        if not target_plant:
            raise HTTPException(status_code=404, detail="Target manufacturing plant not found")

    for field, value in update_data.items():
        setattr(employee, field, value)
        
    db.add(employee)
    db.add(AuditLog(
        user_id=current_user.id,
        action="Update Workforce",
        details=f"Updated details for workforce personnel {employee.first_name} {employee.last_name}."
    ))
    db.commit()
    db.refresh(employee)
    employee.plant_name = employee.plant.name
    return employee

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Workforce personnel not found")
        
    if current_user.role == "Plant Manager" and employee.plant_id != current_user.plant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete workforce personnel in your own plant."
        )
        
    db.delete(employee)
    db.add(AuditLog(
        user_id=current_user.id,
        action="Delete Workforce",
        details=f"Deleted workforce personnel {employee.first_name} {employee.last_name}."
    ))
    db.commit()
    return {"message": "Workforce personnel deleted successfully"}
