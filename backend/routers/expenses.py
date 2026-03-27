from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import aiofiles, os, uuid
from database import get_db
import models, schemas
from auth import require_admin, get_current_user

router = APIRouter(prefix="/api/transactions", tags=["transactions"])
UPLOAD_DIR = os.path.join(os.getenv("UPLOAD_DIR", "uploads"), "receipts")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[schemas.TransactionOut])
def list_transactions(
    type: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    q = db.query(models.Transaction)
    if type: q = q.filter(models.Transaction.type == type)
    if category: q = q.filter(models.Transaction.category == category)
    return q.order_by(models.Transaction.date.desc()).all()

@router.post("/", response_model=schemas.TransactionOut)
def create_transaction(data: schemas.TransactionCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    tx = models.Transaction(**data.model_dump(), created_by=current_user.id)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

@router.delete("/{tx_id}")
def delete_transaction(tx_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="İşlem bulunamadı")
    db.delete(tx)
    db.commit()
    return {"message": "İşlem silindi"}

@router.get("/summary")
def transaction_summary(db: Session = Depends(get_db), _=Depends(get_current_user)):
    from sqlalchemy import func, extract
    now = datetime.utcnow()
    # Monthly breakdown for last 6 months
    monthly = []
    for i in range(5, -1, -1):
        month = (now.month - i - 1) % 12 + 1
        year = now.year if now.month - i > 0 else now.year - 1
        income = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.type == models.TransactionType.income,
            extract('month', models.Transaction.date) == month,
            extract('year', models.Transaction.date) == year
        ).scalar() or 0
        expense = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.type == models.TransactionType.expense,
            extract('month', models.Transaction.date) == month,
            extract('year', models.Transaction.date) == year
        ).scalar() or 0
        monthly.append({"month": f"{year}-{month:02d}", "income": income, "expense": expense})

    total_income = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == models.TransactionType.income
    ).scalar() or 0
    total_expense = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == models.TransactionType.expense
    ).scalar() or 0

    # Category breakdown
    from sqlalchemy import case
    cats = db.query(models.Transaction.category, func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == models.TransactionType.expense
    ).group_by(models.Transaction.category).all()

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "monthly": monthly,
        "expense_by_category": [{"category": c, "amount": a} for c, a in cats]
    }
