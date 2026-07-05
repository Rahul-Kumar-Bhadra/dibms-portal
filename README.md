# 🏭 DIBMS — Dana India Branch Management System

**Dana Manufacturing Enterprise Operations Platform (DMEOP)**

A full-stack enterprise operations management dashboard for Dana India's manufacturing plants across the country. Built with React + TypeScript (Vite) frontend and FastAPI (Python) backend.

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Demo Credentials](#-demo-credentials)
- [Deployment](#-deployment)
- [Docker](#-docker)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [License](#-license)

---

## ✨ Features

| Module | Description |
|--------|-------------|
| **Executive Dashboard** | Real-time KPIs: revenue, production output, workforce strength, pending reports |
| **Plant Directory** | Register, view, and manage manufacturing plants across India (North/South/East/West) |
| **Workforce Management** | Onboard/edit/offboard personnel across departments (Assembly, QA, EH&S, Logistics, Engineering) |
| **Operations Reports** | Monthly submission of production metrics, financials, safety incidents, quality scores |
| **Report Approval Workflow** | Enterprise Admin approves/rejects plant manager submissions |
| **Technical Documents** | Upload, categorize, and download SOPs, calibration schedules, safety compliance documents |
| **Analytics** | Interactive charts: quality score comparison, financial trends, plant performance matrix |
| **Notifications** | System alerts, broadcast announcements, and targeted plant notifications |
| **Audit Trail** | Security audit logs tracking all user actions with timestamps |
| **Settings** | Password management and profile view |

### Role-Based Access Control (RBAC)

| Role | Access |
|------|--------|
| **Enterprise Admin** | Full access: all plants, analytics, audit logs, report approval, broadcast notices |
| **Plant Manager** | Scoped access: own plant workforce, report submission, document uploads |

---

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** — Lightning-fast build tooling
- **TailwindCSS 4** — Utility-first styling
- **Recharts** — Interactive data visualizations
- **Lucide React** — Modern icon library
- **Axios** — HTTP client with interceptors
- **React Router v7** — Client-side routing

### Backend
- **FastAPI** — High-performance Python API framework
- **SQLAlchemy** — ORM with type-safe models
- **SQLite** (development) / **PostgreSQL** (production-ready)
- **JWT Authentication** — Secure token-based auth
- **Pydantic** — Data validation and serialization
- **Uvicorn** — ASGI production server

### DevOps
- **Docker** — Containerized deployment
- **Vercel** — Frontend hosting (SPA)
- **Render** — Backend hosting (Python)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                 Client Browser              │
│         React + TypeScript + Vite           │
│              (Vercel / CDN)                 │
└───────────────────┬─────────────────────────┘
                    │ HTTPS (Axios)
                    ▼
┌─────────────────────────────────────────────┐
│              FastAPI Backend                │
│         /api/v1/* REST Endpoints            │
│           (Render / Docker)                 │
├─────────────────────────────────────────────┤
│  Auth │ Plants │ Workforce │ Reports │ Docs │
│  Dashboard │ Notifications │ Audit          │
└───────────────────┬─────────────────────────┘
                    │ SQLAlchemy ORM
                    ▼
┌─────────────────────────────────────────────┐
│        SQLite (dev) / PostgreSQL (prod)     │
└─────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/dana-dashboard.git
cd dana-dashboard
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
Swagger UI docs: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT signing secret (change in production!) | Dev key |
| `DATABASE_URL` | Database connection string | `sqlite:///./dibms.db` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token expiry | `10080` (7 days) |
| `BACKEND_CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173` |
| `UPLOAD_DIR` | File upload directory | `uploads` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |

---

## 👤 Demo Credentials

The database auto-seeds on first startup with demo data.

| Role | Email | Password |
|------|-------|----------|
| Enterprise Admin | `admin@dana-demo.com` | `Admin@123` |
| Plant Manager (Pune) | `manager.pune@dana-demo.com` | `Manager@123` |
| Plant Manager (Chennai) | `manager.chennai@dana-demo.com` | `Manager@123` |

> All plant managers use the password `Manager@123`. Email format: `manager.<city>@dana-demo.com`

---

## 🌐 Deployment

### Frontend → Vercel

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Set **Root Directory** to `frontend`
4. Framework Preset: **Vite**
5. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com/api/v1`
6. Deploy

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Settings:
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
4. Add environment variables:
   - `SECRET_KEY` — generate a strong random key
   - `DATABASE_URL` — `sqlite:///./dibms.db` or PostgreSQL URL
   - `BACKEND_CORS_ORIGINS` — `https://your-vercel-app.vercel.app`
5. Deploy

---

## 🐳 Docker

### Quick Start

```bash
docker compose up --build
```

Access the application at `http://localhost:8000`

### Build Image Only

```bash
docker build -t dibms .
docker run -p 8000:8000 dibms
```

---

## 📁 Project Structure

```
DANA-DASHBOARD/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints/          # Route handlers
│   │   │       ├── auth.py         # Login, registration, JWT
│   │   │       ├── plants.py       # CRUD for manufacturing plants
│   │   │       ├── workforce.py    # Employee management
│   │   │       ├── operations_reports.py  # Monthly report lifecycle
│   │   │       ├── documents.py    # File upload/download
│   │   │       ├── dashboard.py    # Admin & Manager dashboard stats
│   │   │       ├── notifications.py # Alerts & announcements
│   │   │       └── audit.py        # Security audit trail
│   │   ├── core/
│   │   │   ├── config.py           # App settings (env vars)
│   │   │   └── security.py         # JWT & password hashing
│   │   ├── database/
│   │   │   ├── session.py          # SQLAlchemy engine & session
│   │   │   └── seed.py             # Auto-seed demo data
│   │   ├── models.py               # SQLAlchemy ORM models
│   │   └── main.py                 # FastAPI app entry point
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/                     # Static assets (logo, favicon)
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── cards/              # StatCard, etc.
│   │   │   └── layout/             # Sidebar, Header
│   │   ├── context/                # React Context (AuthContext)
│   │   ├── pages/                  # Page components
│   │   │   ├── Analytics/
│   │   │   ├── Audit/
│   │   │   ├── Authentication/
│   │   │   ├── Dashboard/
│   │   │   ├── Documents/
│   │   │   ├── Notifications/
│   │   │   ├── Plants/
│   │   │   ├── Reports/
│   │   │   ├── Settings/
│   │   │   └── Workforce/
│   │   ├── services/               # API client (Axios)
│   │   ├── App.tsx                 # Root component with routing
│   │   └── main.tsx                # Entry point
│   ├── vercel.json                 # Vercel SPA routing config
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
├── Dockerfile                      # Multi-stage Docker build
├── docker-compose.yml
├── render.yaml                     # Render deployment blueprint
├── .gitignore
└── README.md
```

---

## 📖 API Documentation

Once the backend is running, visit:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Health Check:** `http://localhost:8000/health`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User authentication |
| GET | `/api/v1/auth/me` | Current user profile |
| GET | `/api/v1/dashboard/admin` | Enterprise admin dashboard stats |
| GET | `/api/v1/dashboard/branch` | Plant manager dashboard stats |
| GET/POST | `/api/v1/plants/` | List/create manufacturing plants |
| GET/POST | `/api/v1/workforce/` | List/onboard employees |
| GET/POST | `/api/v1/operations-reports/` | List/submit monthly reports |
| POST | `/api/v1/operations-reports/{id}/approve` | Approve a report |
| POST | `/api/v1/documents/upload` | Upload technical document |
| GET | `/api/v1/notifications/` | List notifications |
| GET | `/api/v1/audit/` | Security audit logs |

---

## 📄 License

This project is proprietary to Dana India. All rights reserved.
