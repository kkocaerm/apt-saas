from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import aiofiles, os, uuid
from database import get_db
import models, schemas
from auth import require_admin, get_current_user

router = APIRouter(prefix="/api/documents", tags=["documents"])
BASE_UPLOAD = os.getenv("UPLOAD_DIR", "uploads")
UPLOAD_DIR = os.path.join(BASE_UPLOAD, "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[schemas.DocumentOut])
def list_documents(category: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(models.Document)
    if category:
        q = q.filter(models.Document.category == category)
    return q.order_by(models.Document.created_at.desc()).all()

@router.post("/upload", response_model=schemas.DocumentOut)
async def upload_document(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: str = Form("other"),
    unit_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    doc = models.Document(
        title=title,
        description=description,
        file_path=file_path,
        file_type=file.content_type,
        file_size=len(content),
        category=category,
        unit_id=unit_id,
        uploaded_by=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.get("/download/{doc_id}")
def download_document(doc_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    return FileResponse(doc.file_path, filename=doc.title)

@router.post("/generate-invoice/{dues_id}")
def generate_invoice(dues_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Generate PDF invoice for a dues record."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib import colors
        from reportlab.lib.units import cm
    except ImportError:
        raise HTTPException(status_code=500, detail="reportlab kütüphanesi yüklü değil")

    record = db.query(models.DuesRecord).filter(models.DuesRecord.id == dues_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Aidat kaydı bulunamadı")

    unit = record.unit
    resident = unit.resident if unit else None
    os.makedirs(os.path.join(BASE_UPLOAD, "invoices"), exist_ok=True)
    filename = f"aidat_{dues_id}_{record.year}_{record.month:02d}.pdf"
    path = os.path.join(BASE_UPLOAD, "invoices", filename)

    doc = SimpleDocTemplate(path, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("APARTMAN AİDAT FATURASI", styles['Title']))
    elements.append(Spacer(1, 0.5*cm))

    data = [
        ["Daire No", unit.number if unit else "-"],
        ["Sakin", resident.full_name if resident else "-"],
        ["Dönem", f"{record.year} / {record.month:02d}"],
        ["Tutar", f"₺{record.amount:,.2f}"],
        ["Durum", {"pending": "Bekliyor", "paid": "Ödendi", "overdue": "Gecikmiş"}.get(record.status.value, record.status.value)],
        ["Son Ödeme", record.due_date.strftime("%d.%m.%Y") if record.due_date else "-"],
    ]

    table = Table(data, colWidths=[5*cm, 10*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('ROWBACKGROUNDS', (1, 0), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(table)
    doc.build(elements)

    # Save as document record
    doc_record = models.Document(
        title=f"Aidat Faturası - Daire {unit.number if unit else '?'} - {record.year}/{record.month:02d}",
        file_path=path,
        file_type="application/pdf",
        category="invoice",
        unit_id=unit.id if unit else None,
        uploaded_by=1
    )
    db.add(doc_record)
    db.commit()

    return FileResponse(path, media_type="application/pdf", filename=filename)

@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()
    return {"message": "Belge silindi"}
