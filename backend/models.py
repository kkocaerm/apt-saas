from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    resident = "resident"

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    overdue = "overdue"

class ComplaintStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"

class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    role = Column(Enum(UserRole), default=UserRole.resident)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    unit = relationship("Unit", back_populates="resident", uselist=False)
    complaints = relationship("Complaint", back_populates="resident")
    notifications = relationship("Notification", back_populates="user")

class Building(Base):
    __tablename__ = "buildings"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    total_units = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    units = relationship("Unit", back_populates="building")

class Unit(Base):
    __tablename__ = "units"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, nullable=False)
    floor = Column(Integer)
    type = Column(String)  # 1+1, 2+1, 3+1
    area_m2 = Column(Float)
    monthly_dues = Column(Float, default=500.0)
    building_id = Column(Integer, ForeignKey("buildings.id"))
    resident_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_occupied = Column(Boolean, default=False)
    building = relationship("Building", back_populates="units")
    resident = relationship("User", back_populates="unit")
    dues_records = relationship("DuesRecord", back_populates="unit")

class DuesRecord(Base):
    __tablename__ = "dues_records"
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"))
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True))
    notes = Column(Text, nullable=True)
    unit = relationship("Unit", back_populates="dues_records")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(TransactionType), nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text)
    amount = Column(Float, nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    receipt_path = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))

class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_urgent = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.open)
    priority = Column(String, default="normal")  # low, normal, high
    resident_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    admin_response = Column(Text, nullable=True)
    resident = relationship("User", back_populates="complaints")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String, nullable=False)
    file_type = Column(String)
    file_size = Column(Integer)
    category = Column(String)  # invoice, minutes, contract, other
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="notifications")
