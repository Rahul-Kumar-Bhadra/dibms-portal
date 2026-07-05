from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core import security
from app.core.config import settings
from app.api import deps
from app.models import User, AuditLog
from app.schemas import Token, UserOut

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

@router.post("/login", response_model=Token)
def login_access_token(
    login_data: LoginRequest,
    db: Session = Depends(deps.get_db)
) -> Any:
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not security.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    
    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="Login",
        details=f"User {user.email} logged in successfully."
    )
    db.add(audit)
    db.commit()
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.email, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserOut)
def read_user_me(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    user_out = UserOut.model_validate(current_user)
    if current_user.plant:
        user_out.plant_name = current_user.plant.name
    return user_out

@router.post("/change-password")
def change_password(
    pwd_data: PasswordChange,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
) -> Any:
    if not security.verify_password(pwd_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    current_user.hashed_password = security.get_password_hash(pwd_data.new_password)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="Change Password",
        details="User successfully changed password."
    )
    db.add(audit)
    db.add(current_user)
    db.commit()
    return {"message": "Password changed successfully"}
