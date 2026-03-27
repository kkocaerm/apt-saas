from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole, PaymentStatus, ComplaintStatus, TransactionType

# ─── Auth ───────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.resident

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# ─── Building ───────────────────────────────────────────────────────────────

class BuildingCreate(BaseModel):
    name: str
    address: str

class BuildingOut(BaseModel):
    id: int
    name: str
    address: str
    total_units: int
    created_at: datetime
    class Config:
        from_attributes = True

# ─── Unit ───────────────────────────────────────────────────────────────────

class UnitCreate(BaseModel):
    number: str
    floor: Optional[int] = None
    type: Optional[str] = None
    area_m2: Optional[float] = None
    monthly_dues: float = 500.0
    building_id: int

class UnitUpdate(BaseModel):
    monthly_dues: Optional[float] = None
    resident_id: Optional[int] = None
    type: Optional[str] = None
    area_m2: Optional[float] = None

class UnitOut(BaseModel):
    id: int
    number: str
    floor: Optional[int]
    type: Optional[str]
    area_m2: Optional[float]
    monthly_dues: float
    building_id: int
    resident_id: Optional[int]
    is_occupied: bool
    resident: Optional[UserOut]
    class Config:
        from_attributes = True

# ─── Dues ───────────────────────────────────────────────────────────────────

class DuesRecordCreate(BaseModel):
    unit_id: int
    year: int
    month: int
    amount: float
    due_date: Optional[datetime] = None

class DuesStatusUpdate(BaseModel):
    status: PaymentStatus
    notes: Optional[str] = None

class DuesRecordOut(BaseModel):
    id: int
    unit_id: int
    year: int
    month: int
    amount: float
    status: PaymentStatus
    paid_at: Optional[datetime]
    due_date: Optional[datetime]
    notes: Optional[str]
    unit: Optional[UnitOut]
    class Config:
        from_attributes = True

# ─── Transaction ────────────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    type: TransactionType
    category: str
    description: Optional[str] = None
    amount: float
    date: Optional[datetime] = None

class TransactionOut(BaseModel):
    id: int
    type: TransactionType
    category: str
    description: Optional[str]
    amount: float
    date: datetime
    receipt_path: Optional[str]
    class Config:
        from_attributes = True

# ─── Announcement ───────────────────────────────────────────────────────────

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    is_urgent: bool = False
    expires_at: Optional[datetime] = None

class AnnouncementOut(BaseModel):
    id: int
    title: str
    content: str
    is_urgent: bool
    created_at: datetime
    expires_at: Optional[datetime]
    class Config:
        from_attributes = True

# ─── Complaint ──────────────────────────────────────────────────────────────

class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    priority: str = "normal"

class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    admin_response: Optional[str] = None
    priority: Optional[str] = None

class ComplaintOut(BaseModel):
    id: int
    title: str
    description: str
    category: Optional[str]
    status: ComplaintStatus
    priority: str
    admin_response: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    resident: Optional[UserOut]
    class Config:
        from_attributes = True

# ─── Document ───────────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    file_path: str
    file_type: Optional[str]
    file_size: Optional[int]
    category: Optional[str]
    unit_id: Optional[int]
    created_at: datetime
    class Config:
        from_attributes = True

# ─── Reports ────────────────────────────────────────────────────────────────

class ReportSummary(BaseModel):
    total_units: int
    occupied_units: int
    total_residents: int
    monthly_dues_expected: float
    monthly_dues_collected: float
    monthly_dues_pending: float
    total_income: float
    total_expense: float
    balance: float
    open_complaints: int
    collection_rate: float
