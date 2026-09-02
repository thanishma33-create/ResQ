import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    RoleChecker,
    require_admin,
)
from services.audit_service import log_audit

router = APIRouter(tags=["Authentication & Access Control"])

@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Public user registration.
    Allows public creation of 'citizen' or 'volunteer' accounts.
    Administrative ('admin') and operational ('operator') roles cannot be self-assigned.
    """
    # Check if username or email already exists
    if db.query(models.User).filter(models.User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already registered"
        )
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    # Security: Explicitly reject client attempts to self-provision admin/operator privileges
    requested_role = (user_in.role or "citizen").strip().lower()
    if requested_role in ("admin", "operator"):
        log_audit(
            db=db,
            action="UNAUTHORIZED_ROLE_REGISTRATION_ATTEMPT",
            entity_type="User",
            entity_id=user_in.username,
            notes=f"Attempted self-registration as '{requested_role}' rejected."
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Registration for role '{requested_role}' is restricted to backend administrators."
        )

    allowed_public_roles = {"citizen", "volunteer", "rescue_team"}
    role = requested_role if requested_role in allowed_public_roles else "citizen"

    user = models.User(
        username=user_in.username.strip(),
        email=user_in.email.strip().lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        role=role,
        phone=user_in.phone,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(
        db=db,
        action="REGISTER",
        entity_type="User",
        entity_id=str(user.id),
        user_id=user.id,
        username=user.username
    )
    return user


@router.post("/login", response_model=schemas.Token)
def login_json(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate with username or email and return JWT access token.
    Enforces password verification, account activation status, and security audit logging.
    """
    login_identifier = credentials.username_or_email.strip()
    user = db.query(models.User).filter(
        (models.User.username == login_identifier) | (models.User.email == login_identifier.lower())
    ).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        log_audit(
            db=db,
            action="FAILED_LOGIN_ATTEMPT",
            entity_type="User",
            entity_id=login_identifier,
            notes="Invalid credentials submitted"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        log_audit(
            db=db,
            action="LOGIN_DEACTIVATED_ACCOUNT",
            entity_type="User",
            entity_id=str(user.id),
            user_id=user.id,
            username=user.username
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role, "user_id": user.id})
    
    # Audit sensitive / administrative logins
    if user.role in ("admin", "operator"):
        log_audit(
            db=db,
            action="ADMIN_LOGIN",
            entity_type="User",
            entity_id=str(user.id),
            user_id=user.id,
            username=user.username,
            notes=f"Successful {user.role.upper()} sign in"
        )
    else:
        log_audit(
            db=db,
            action="LOGIN",
            entity_type="User",
            entity_id=str(user.id),
            user_id=user.id,
            username=user.username
        )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/token", response_model=schemas.Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 compatible token login for Swagger / OpenAPI UI."""
    login_identifier = form_data.username.strip()
    user = db.query(models.User).filter(
        (models.User.username == login_identifier) | (models.User.email == login_identifier.lower())
    ).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role, "user_id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=schemas.UserOut)
def get_current_user_profile(current_user: models.User = Depends(get_current_user)):
    """Retrieve profile and authoritative role of the currently logged-in user."""
    return current_user


@router.put("/me", response_model=schemas.UserOut)
def update_current_user_profile(
    update_data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile information of the logged-in user."""
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name.strip()
    if update_data.email is not None and update_data.email.strip().lower() != current_user.email:
        new_email = update_data.email.strip().lower()
        if db.query(models.User).filter(models.User.email == new_email, models.User.id != current_user.id).first():
            raise HTTPException(status_code=400, detail="Email is already in use by another account")
        current_user.email = new_email
    if update_data.phone is not None:
        current_user.phone = update_data.phone

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/users", response_model=List[schemas.UserOut])
def list_users(
    skip: int = 0,
    limit: int = 50,
    role: Optional[str] = None,
    current_user: models.User = Depends(RoleChecker(["admin", "operator"])),
    db: Session = Depends(get_db)
):
    """List system users (Admin & Operator only)."""
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role.lower())
    return query.offset(skip).limit(limit).all()


@router.patch("/users/{user_id}/status", response_model=schemas.UserOut)
def update_user_status(
    user_id: int,
    is_active: bool,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to activate or deactivate a user account."""
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    target_user.is_active = is_active
    db.commit()
    db.refresh(target_user)

    log_audit(
        db=db,
        action="USER_STATUS_CHANGE",
        entity_type="User",
        entity_id=str(target_user.id),
        user_id=current_user.id,
        username=current_user.username,
        notes=f"User {target_user.username} active status set to {is_active}"
    )
    return target_user
