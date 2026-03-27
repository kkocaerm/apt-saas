from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth import require_admin, get_current_user

router = APIRouter(prefix="/api/announcements", tags=["announcements"])

@router.get("/", response_model=List[schemas.AnnouncementOut])
def list_announcements(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Announcement).order_by(
        models.Announcement.is_urgent.desc(),
        models.Announcement.created_at.desc()
    ).all()

@router.post("/", response_model=schemas.AnnouncementOut)
def create_announcement(data: schemas.AnnouncementCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    ann = models.Announcement(**data.model_dump(), created_by=current_user.id)
    db.add(ann)
    db.commit()
    db.refresh(ann)
    # Create notification for all residents
    residents = db.query(models.User).filter(models.User.role == models.UserRole.resident).all()
    for r in residents:
        notif = models.Notification(
            user_id=r.id,
            title=f"{'🚨 ACİL: ' if data.is_urgent else ''}{data.title}",
            message=data.content[:200]
        )
        db.add(notif)
    db.commit()
    return ann

@router.delete("/{ann_id}")
def delete_announcement(ann_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    ann = db.query(models.Announcement).filter(models.Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Duyuru bulunamadı")
    db.delete(ann)
    db.commit()
    return {"message": "Duyuru silindi"}
