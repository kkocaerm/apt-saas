from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from auth import require_admin, get_current_user

router = APIRouter(prefix="/api/units", tags=["units"])

@router.get("/", response_model=List[schemas.UnitOut])
def list_units(building_id: Optional[int] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(models.Unit)
    if building_id:
        q = q.filter(models.Unit.building_id == building_id)
    return q.all()

@router.post("/", response_model=schemas.UnitOut)
def create_unit(data: schemas.UnitCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    unit = models.Unit(**data.model_dump())
    db.add(unit)
    # update building total
    building = db.query(models.Building).filter(models.Building.id == data.building_id).first()
    if building:
        building.total_units = db.query(models.Unit).filter(models.Unit.building_id == data.building_id).count() + 1
    db.commit()
    db.refresh(unit)
    return unit

@router.put("/{unit_id}", response_model=schemas.UnitOut)
def update_unit(unit_id: int, data: schemas.UnitUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    unit = db.query(models.Unit).filter(models.Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Daire bulunamadı")
    update_data = data.model_dump(exclude_unset=True)
    if "resident_id" in update_data:
        unit.is_occupied = update_data["resident_id"] is not None
    for k, v in update_data.items():
        setattr(unit, k, v)
    db.commit()
    db.refresh(unit)
    return unit

@router.delete("/{unit_id}")
def delete_unit(unit_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    unit = db.query(models.Unit).filter(models.Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Daire bulunamadı")
    db.delete(unit)
    db.commit()
    return {"message": "Daire silindi"}

# Buildings
@router.get("/buildings/", response_model=List[schemas.BuildingOut])
def list_buildings(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Building).all()

@router.post("/buildings/", response_model=schemas.BuildingOut)
def create_building(data: schemas.BuildingCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    building = models.Building(**data.model_dump())
    db.add(building)
    db.commit()
    db.refresh(building)
    return building

# Residents / Users
@router.get("/residents/", response_model=List[schemas.UserOut])
def list_residents(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(models.User).filter(models.User.role == models.UserRole.resident).all()
