from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth as auth_utils

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-posta veya şifre hatalı")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Hesap devre dışı")
    token = auth_utils.create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "full_name": user.full_name}

@router.post("/register", response_model=schemas.UserOut)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")
    user = models.User(
        email=data.email,
        hashed_password=auth_utils.hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth_utils.get_current_user)):
    return current_user
