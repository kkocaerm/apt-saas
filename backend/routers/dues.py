from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
import models, schemas
from auth import require_admin, get_current_user

router = APIRouter(prefix="/api/dues", tags=["dues"])

@router.get("/", response_model=List[schemas.DuesRecordOut])
def list_dues(
    unit_id: Optional[int] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    q = db.query(models.DuesRecord)
    if unit_id: q = q.filter(models.DuesRecord.unit_id == unit_id)
    if year: q = q.filter(models.DuesRecord.year == year)
    if month: q = q.filter(models.DuesRecord.month == month)
    if status: q = q.filter(models.DuesRecord.status == status)
    return q.order_by(models.DuesRecord.year.desc(), models.DuesRecord.month.desc()).all()

@router.post("/generate/{year}/{month}")
def generate_monthly_dues(year: int, month: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Generate dues records for all occupied units for a given month."""
    units = db.query(models.Unit).filter(models.Unit.is_occupied == True).all()
    created = 0
    for unit in units:
        existing = db.query(models.DuesRecord).filter(
            models.DuesRecord.unit_id == unit.id,
            models.DuesRecord.year == year,
            models.DuesRecord.month == month
        ).first()
        if not existing:
            due_date = datetime(year, month, 20)
            record = models.DuesRecord(
                unit_id=unit.id,
                year=year, month=month,
                amount=unit.monthly_dues,
                due_date=due_date,
                status=models.PaymentStatus.pending
            )
            db.add(record)
            created += 1
    db.commit()
    return {"message": f"{created} aidat kaydı oluşturuldu"}

@router.post("/", response_model=schemas.DuesRecordOut)
def create_dues(data: schemas.DuesRecordCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    record = models.DuesRecord(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.put("/{dues_id}/status")
def update_dues_status(dues_id: int, data: schemas.DuesStatusUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    record = db.query(models.DuesRecord).filter(models.DuesRecord.id == dues_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Aidat kaydı bulunamadı")
    record.status = data.status
    if data.status == models.PaymentStatus.paid:
        record.paid_at = datetime.utcnow()
    if data.notes:
        record.notes = data.notes
    db.commit()
    db.refresh(record)
    return record

@router.get("/summary/monthly")
def monthly_summary(year: int, month: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    records = db.query(models.DuesRecord).filter(
        models.DuesRecord.year == year,
        models.DuesRecord.month == month
    ).all()
    total = sum(r.amount for r in records)
    paid = sum(r.amount for r in records if r.status == models.PaymentStatus.paid)
    pending = sum(r.amount for r in records if r.status == models.PaymentStatus.pending)
    overdue = sum(r.amount for r in records if r.status == models.PaymentStatus.overdue)
    return {
        "year": year, "month": month,
        "total_expected": total,
        "collected": paid,
        "pending": pending,
        "overdue": overdue,
        "collection_rate": round((paid / total * 100) if total > 0 else 0, 1),
        "total_records": len(records),
        "paid_count": sum(1 for r in records if r.status == models.PaymentStatus.paid),
    }
