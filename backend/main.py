from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os, models
from database import engine, SessionLocal
from auth import hash_password
from routers import auth, units, dues, expenses, announcements, complaints, documents, reports

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Apartman Yönetim Sistemi",
    description="Kapsamlı apartman aidat ve yönetim API'si",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(units.router)
app.include_router(dues.router)
app.include_router(expenses.router)
app.include_router(announcements.router)
app.include_router(complaints.router)
app.include_router(documents.router)
app.include_router(reports.router)

# Upload dir — /tmp on Render free tier (ephemeral), local "uploads/" otherwise
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "documents"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "receipts"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "invoices"), exist_ok=True)

try:
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except Exception:
    pass  # If dir doesn't exist yet, skip mount

@app.on_event("startup")
def seed_admin():
    """Create default admin user if none exists."""
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.role == models.UserRole.admin).first()
        if not existing:
            admin = models.User(
                email="admin@apartman.com",
                hashed_password=hash_password("admin123"),
                full_name="Yönetici",
                role=models.UserRole.admin
            )
            db.add(admin)
            # Create default building
            building = models.Building(name="Güneş Apartmanı", address="Atatürk Cad. No:1, İstanbul")
            db.add(building)
            db.flush()
            # Demo units
            for i in range(1, 9):
                floor = (i - 1) // 2 + 1
                unit = models.Unit(
                    number=str(i),
                    floor=floor,
                    type="2+1" if i % 2 == 0 else "3+1",
                    area_m2=85.0 if i % 2 == 0 else 110.0,
                    monthly_dues=600.0,
                    building_id=building.id
                )
                db.add(unit)
            db.commit()
            print("✅ Admin kullanıcı ve demo veriler oluşturuldu")
            print("   Email: admin@apartman.com | Şifre: admin123")
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Apartman Yönetim API'si çalışıyor 🏢", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}
