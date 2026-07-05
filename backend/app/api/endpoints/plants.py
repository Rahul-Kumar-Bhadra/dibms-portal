from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.api import deps
from app.models import Plant, User, AuditLog
from app.schemas import PlantOut, PlantCreate

router = APIRouter()

class PlantUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    location: Optional[str] = None
    region: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    status: Optional[str] = None

@router.get("/", response_model=List[PlantOut])
def read_plants(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    return db.query(Plant).all()

@router.get("/{plant_id}", response_model=PlantOut)
def read_plant(
    plant_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    if current_user.role == "Plant Manager" and current_user.plant_id != plant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot view details of other manufacturing plants."
        )
    
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Manufacturing plant not found")
    return plant

@router.post("/", response_model=PlantOut, dependencies=[Depends(deps.RoleChecker(["Enterprise Admin"]))])
def create_plant(
    plant_in: PlantCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    db_plant = db.query(Plant).filter(Plant.id == plant_in.id).first()
    if db_plant:
        raise HTTPException(status_code=400, detail="Plant with this ID already exists.")
        
    plant = Plant(**plant_in.model_dump())
    db.add(plant)
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="Create Plant",
        details=f"Created plant {plant.id} - {plant.name} in region {plant.region}."
    ))
    db.commit()
    db.refresh(plant)
    return plant

@router.put("/{plant_id}", response_model=PlantOut, dependencies=[Depends(deps.RoleChecker(["Enterprise Admin"]))])
def update_plant(
    plant_id: str,
    plant_in: PlantUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
        
    update_data = plant_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plant, field, value)
        
    db.add(plant)
    db.add(AuditLog(
        user_id=current_user.id,
        action="Update Plant",
        details=f"Updated details for plant {plant_id}."
    ))
    db.commit()
    db.refresh(plant)
    return plant

@router.delete("/{plant_id}", dependencies=[Depends(deps.RoleChecker(["Enterprise Admin"]))])
def delete_plant(
    plant_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
        
    db.delete(plant)
    db.add(AuditLog(
        user_id=current_user.id,
        action="Delete Plant",
        details=f"Deleted plant {plant_id} from database."
    ))
    db.commit()
    return {"message": "Plant deleted successfully"}
