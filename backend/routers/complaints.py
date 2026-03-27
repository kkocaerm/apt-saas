from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from auth import require_admin, get_current_user

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

@router.get("/", response_model=List[schemas.ComplaintOut])
def list_complaints(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(models.Complaint)
    if current_user.role != models.UserRole.admin:
        q = q.filter(models.Complaint.resident_id == current_user.id)
    if status:
        q = q.filter(models.Complaint.status == status)
    return q.order_by(models.Complaint.created_at.desc()).all()

@router.post("/", response_model=schemas.ComplaintOut)
def create_complaint(data: schemas.ComplaintCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    complaint = models.Complaint(**data.model_dump(), resident_id=current_user.id)
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint

@router.put("/{complaint_id}", response_model=schemas.ComplaintOut)
def update_complaint(complaint_id: int, data: schemas.ComplaintUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(complaint, k, v)
    db.commit()
    db.refresh(complaint)
    return complaint

@router.delete("/{complaint_id}")
def delete_complaint(complaint_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")
    db.delete(complaint)
    db.commit()
    return {"message": "Şikayet silindi"}
