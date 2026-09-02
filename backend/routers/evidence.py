import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from config import settings
from database import get_db
import models
import schemas
from auth import get_current_user, RoleChecker
from services.incident_history_service import log_incident_event
from services.audit_service import log_audit

router = APIRouter(prefix="/api/evidence", tags=["Proof of Resolution & Evidence"])

@router.post("/upload/{emergency_id}", response_model=schemas.EvidenceOut, status_code=status.HTTP_201_CREATED)
async def upload_proof_of_resolution(
    emergency_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    resolution_notes: Optional[str] = Form(None),
    current_user: models.User = Depends(RoleChecker(["admin", "operator", "rescue_team", "volunteer"])),
    db: Session = Depends(get_db)
):
    """
    Upload on-scene proof of resolution (photo/document).
    Validates file format and file size limits (<= 10MB) and attaches to emergency history.
    """
    emergency = db.query(models.Emergency).filter(models.Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    # Validate file extension
    filename = file.filename or "evidence.jpg"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '.{ext}' is not allowed. Supported: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Read and validate size
    content = await file.read()
    file_size = len(content)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB}MB"
        )

    # Save unique file to upload directory
    unique_filename = f"resq_evidence_{emergency_id}_{uuid.uuid4().hex[:8]}.{ext}"
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    evidence = models.Evidence(
        emergency_id=emergency_id,
        file_path=file_path.replace("\\", "/"),
        file_name=filename,
        file_type=file.content_type or f"image/{ext}",
        file_size=file_size,
        description=description,
        resolution_notes=resolution_notes,
        uploaded_by_user_id=current_user.id
    )
    db.add(evidence)

    # If resolution notes provided, attach to emergency
    if resolution_notes:
        emergency.resolution_notes = (emergency.resolution_notes or "") + f"\n[Evidence Uploaded]: {resolution_notes}"

    db.commit()
    db.refresh(evidence)

    # Log Incident Event
    log_incident_event(
        db=db,
        emergency_id=emergency.id,
        event_type="EVIDENCE_UPLOADED",
        description=f"Proof of resolution uploaded ({filename}, {round(file_size/1024, 1)} KB) by {current_user.full_name}",
        actor_user_id=current_user.id,
        actor_name=current_user.full_name,
        metadata={"file_name": filename, "file_path": evidence.file_path}
    )

    log_audit(
        db=db,
        action="UPLOAD_EVIDENCE",
        entity_type="Evidence",
        entity_id=str(evidence.id),
        user_id=current_user.id,
        username=current_user.username
    )

    return evidence


@router.get("/{emergency_id}", response_model=List[schemas.EvidenceOut])
def get_emergency_evidence(emergency_id: int, db: Session = Depends(get_db)):
    """Retrieve all evidence files associated with an emergency."""
    return db.query(models.Evidence).filter(models.Evidence.emergency_id == emergency_id).order_by(models.Evidence.created_at.desc()).all()
