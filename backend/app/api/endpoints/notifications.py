from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api import deps
from app.models import Notification, User, AuditLog
from app.schemas import NotificationOut, NotificationBase

router = APIRouter()

@router.get("/", response_model=List[NotificationOut])
def read_notifications(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    if current_user.role == "Enterprise Admin":
        return db.query(Notification).order_by(Notification.created_at.desc()).all()
        
    return db.query(Notification).filter(
        or_(
            Notification.plant_id == current_user.plant_id,
            Notification.plant_id == None
        )
    ).order_by(Notification.created_at.desc()).all()

@router.post("/{notif_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notif_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    if current_user.role == "Plant Manager" and notif.plant_id is not None and notif.plant_id != current_user.plant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access this notification."
        )
        
    notif.is_read = True
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

@router.post("/announcement", response_model=NotificationOut, dependencies=[Depends(deps.RoleChecker(["Enterprise Admin"]))])
def create_announcement(
    notif_in: NotificationBase,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    notif = Notification(**notif_in.model_dump())
    db.add(notif)
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="Create Announcement",
        details=f"Created system announcement: {notif_in.title}."
    ))
    db.commit()
    db.refresh(notif)
    return notif
