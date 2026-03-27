# 🏢 ApartmanPro — Yönetim Sistemi

Apartmanlar için tam kapsamlı aidat takip ve yönetim platformu.

---

## ✨ Özellikler

| Modül | Özellikler |
|-------|-----------|
| **Daire Yönetimi** | Daire ekle/düzenle/sil, sakin atama, doluluk takibi |
| **Aidat Takibi** | Aylık otomatik oluşturma, ödeme/gecikme işaretleme, PDF fatura |
| **Gider & Gelir** | Kategori bazlı kayıt, bakiye hesabı, aylık grafik |
| **Duyurular** | Acil/normal duyuru, tüm sakinlere bildirim |
| **Şikayetler** | Sakin şikayetleri, öncelik, yönetici yanıtı, durum takibi |
| **Belgeler** | PDF/DOC/XLS yükleme, kategori filtre, indirme |
| **Raporlar** | Tahsilat oranı, doluluk, 6 aylık trend grafikleri |

---

## 🚀 Hızlı Başlangıç (Yerel Geliştirme)

### Gereksinimler
- Python 3.11+
- Node.js 20+

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# Uygulama: http://localhost:5173
```

### Varsayılan Giriş
```
E-posta : admin@apartman.com
Şifre   : admin123
```

---

## 🐳 Docker ile Çalıştır

```bash
# Tüm sistemi tek komutla başlat
docker compose up -d --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## ☁️ Render.com Free Tier Deploy

### Adım 1 — GitHub'a Push
```bash
git init
git add .
git commit -m "ilk commit"
git remote add origin https://github.com/KULLANICI/REPO.git
git push -u origin main
```

### Adım 2 — Render Blueprint
1. [render.com](https://render.com) → Dashboard → **New** → **Blueprint**
2. GitHub reposunu bağlayın ve seçin
3. `render.yaml` otomatik algılanır → **Apply**
4. Şu 3 kaynak oluşturulur:
   - `apartman-db` — Ücretsiz PostgreSQL
   - `apartman-backend` — FastAPI web servisi
   - `apartman-frontend` — Static site

### Adım 3 — Frontend API URL'ini Ayarla
Deploy bittikten sonra backend URL'ini öğrenin:
- Render Dashboard → `apartman-backend` → URL'yi kopyalayın (örn. `https://apartman-backend.onrender.com`)

`apartman-frontend` servisine gidin:
- **Environment** sekmesi → **Add Environment Variable**
```
Key:   VITE_API_URL
Value: https://apartman-backend.onrender.com
```
- **Manual Deploy → Deploy latest commit** tıklayın

### ⚠️ Free Tier Sınırlamaları
| Konu | Açıklama |
|------|----------|
| **Uyku modu** | Backend 15 dk hareketsiz kalırsa uyur, ilk istek ~30 sn sürer |
| **Upload kalıcılığı** | Yüklenen dosyalar `/tmp`'ye yazılır, servis restart'ta silinir |
| **PostgreSQL süresi** | Ücretsiz DB 90 gün sonra silinir, Render uyarı maili gönderir |
| **Bandwidth** | Aylık 100 GB (genellikle yeterli) |

> 💡 **Uyku modunu engellemek için:** [UptimeRobot](https://uptimerobot.com) ile `https://apartman-backend.onrender.com/health` adresini her 10 dakikada pingletebilirsiniz (ücretsiz).

---

## 🖥️ VPS'e Taşıma (Ubuntu 22.04+)

```bash
# Sunucuya giriş
ssh root@SUNUCU_IP

# Repoyu klonla
git clone https://github.com/KULLANICI/REPO.git /opt/apartman-yonetim
cd /opt/apartman-yonetim

# (Opsiyonel) domain ayarla
export DOMAIN=apartmanim.com

# Kurulum scriptini çalıştır
chmod +x deploy.sh
bash deploy.sh
```

Script şunları otomatik yapar:
- Docker & Docker Compose kurulumu
- Nginx reverse proxy
- Let's Encrypt SSL (domain girilirse)
- Systemd servisi (sunucu yeniden başlarsa otomatik başlar)

---

## 📁 Proje Yapısı

```
apartman-yonetim/
├── backend/
│   ├── main.py          # FastAPI uygulaması, startup seed
│   ├── models.py        # SQLAlchemy modelleri
│   ├── schemas.py       # Pydantic şemaları
│   ├── auth.py          # JWT + bcrypt
│   ├── database.py      # SQLite/PostgreSQL bağlantısı
│   ├── routers/
│   │   ├── auth.py      # Giriş, kayıt, profil
│   │   ├── units.py     # Daireler, binalar, sakinler
│   │   ├── dues.py      # Aidat takibi
│   │   ├── expenses.py  # Gider/gelir
│   │   ├── announcements.py
│   │   ├── complaints.py
│   │   ├── documents.py # Yükleme, PDF fatura
│   │   └── reports.py   # Özet, trendler
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/       # 9 sayfa
│   │   ├── components/  # Layout, Sidebar
│   │   ├── contexts/    # AuthContext
│   │   └── api/         # Axios client
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── render.yaml
├── deploy.sh
└── README.md
```

---

## 🔒 Üretim Güvenliği

```bash
# .env dosyasında mutlaka değiştirin:
SECRET_KEY=<openssl rand -hex 32 ile üretin>

# Admin şifresini değiştirin — ilk girişten sonra:
# Sakinler sayfası → yeni admin kullanıcı oluşturun → eskisini devre dışı bırakın

# PostgreSQL'e geçiş (önerilir):
DATABASE_URL=postgresql://user:pass@host:5432/apartman
```

---

## 🗄️ SQLite → PostgreSQL Geçişi

`backend/.env` dosyasını güncelleyin:
```
DATABASE_URL=postgresql://apartman:sifre@localhost:5432/apartman_db
```

`requirements.txt`'e ekleyin:
```
psycopg2-binary==2.9.9
```

Backend'i yeniden başlatın — tablolar otomatik oluşur.

---

## 📡 API Endpoints

Tüm endpoint'ler için: `http://localhost:8000/docs` (Swagger UI)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/login` | JWT token al |
| GET | `/api/units/` | Daireleri listele |
| POST | `/api/dues/generate/{year}/{month}` | Aylık aidatları oluştur |
| PUT | `/api/dues/{id}/status` | Ödeme durumu güncelle |
| GET | `/api/documents/generate-invoice/{id}` | PDF fatura indir |
| GET | `/api/reports/summary` | Genel özet |
| GET | `/api/transactions/summary` | Mali özet + grafikler |

---

## 🤝 Katkı

Pull request ve issue'lar memnuniyetle karşılanır!

---

*ApartmanPro — FastAPI + React + SQLite/PostgreSQL*
