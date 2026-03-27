from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from database import get_db
import models, schemas
from auth import require_admin

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/summary", response_model=schemas.ReportSummary)
def get_summary(db: Session = Depends(get_db), _=Depends(require_admin)):
    now = datetime.utcnow()
    total_units = db.query(models.Unit).count()
    occupied_units = db.query(models.Unit).filter(models.Unit.is_occupied == True).count()
    total_residents = db.query(models.User).filter(models.User.role == models.UserRole.resident).count()

    # This month dues
    month_dues = db.query(models.DuesRecord).filter(
        models.DuesRecord.year == now.year,
        models.DuesRecord.month == now.month
    ).all()
    expected = sum(d.amount for d in month_dues)
    collected = sum(d.amount for d in month_dues if d.status == models.PaymentStatus.paid)
    pending = sum(d.amount for d in month_dues if d.status != models.PaymentStatus.paid)

    total_income = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == models.TransactionType.income
    ).scalar() or 0
    total_expense = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == models.TransactionType.expense
    ).scalar() or 0
    open_complaints = db.query(models.Complaint).filter(
        models.Complaint.status == models.ComplaintStatus.open
    ).count()

    return schemas.ReportSummary(
        total_units=total_units,
        occupied_units=occupied_units,
        total_residents=total_residents,
        monthly_dues_expected=expected,
        monthly_dues_collected=collected,
        monthly_dues_pending=pending,
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        open_complaints=open_complaints,
        collection_rate=round((collected / expected * 100) if expected > 0 else 0, 1)
    )

@router.get("/dues-trend")
def dues_trend(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Last 6 months dues collection trend."""
    now = datetime.utcnow()
    result = []
    for i in range(5, -1, -1):
        month = (now.month - i - 1) % 12 + 1
        year = now.year if now.month - i > 0 else now.year - 1
        records = db.query(models.DuesRecord).filter(
            models.DuesRecord.year == year,
            models.DuesRecord.month == month
        ).all()
        total = sum(r.amount for r in records)
        paid = sum(r.amount for r in records if r.status == models.PaymentStatus.paid)
        result.append({
            "label": f"{year}/{month:02d}",
            "total": total,
            "paid": paid,
            "rate": round((paid / total * 100) if total > 0 else 0, 1)
        })
    return result

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    notifs = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(20).all()
    unread = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).count()
    return {"notifications": notifs, "unread_count": unread}

@router.put("/notifications/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"ok": True}
