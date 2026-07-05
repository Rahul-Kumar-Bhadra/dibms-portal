import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.session import engine, SessionLocal, Base
from app.database.seed import seed_db
from app.api.endpoints import auth, plants, workforce, operations_reports, documents, dashboard, notifications, audit

# Create database tables directly
Base.metadata.create_all(bind=engine)

# Auto seed database on startup if empty
db = SessionLocal()
try:
    seed_db(db)
finally:
    db.close()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middleware to inject Security Headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Mount upload directory
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(plants.router, prefix=f"{settings.API_V1_STR}/plants", tags=["plants"])
app.include_router(workforce.router, prefix=f"{settings.API_V1_STR}/workforce", tags=["workforce"])
app.include_router(operations_reports.router, prefix=f"{settings.API_V1_STR}/operations-reports", tags=["operations-reports"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["notifications"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit", tags=["audit"])

@app.get("/")
def root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API. Please go to /docs for Swagger UI documentation."
    }

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring services (e.g. Render, Docker)."""
    return {"status": "ok", "service": settings.PROJECT_NAME, "version": settings.VERSION}
