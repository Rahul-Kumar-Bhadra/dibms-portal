from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models import AuditLog, User
from app.schemas import AuditLogOut

router = APIRouter()

@router.get("/", response_model=List[AuditLogOut], dependencies=[Depends(deps.RoleChecker(["Enterprise Admin"]))])
def read_audit_logs(
    limit: int = 100,
    offset: int = 0,
    action_filter: Optional[str] = None,
    user_filter: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    query = db.query(AuditLog)
    
    if action_filter:
        query = query.filter(AuditLog.action.ilike(f"%{action_filter}%"))
        
    if user_filter:
        # Join User to filter by email
        query = query.join(User).filter(User.email.ilike(f"%{user_filter}%"))
        
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    
    # Populate user_email
    for log in logs:
        if log.user:
            log.user_email = log.user.email
        else:
            log.user_email = "System"
            
    return logs
