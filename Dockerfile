# ============================================
# DIBMS — Multi-stage Dockerfile
# Stage 1: Build React frontend
# Stage 2: Python backend + serve static files
# ============================================

# ---------- Stage 1: Frontend Build ----------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: Backend + Serve ----------
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend into backend static directory
COPY --from=frontend-build /app/frontend/dist ./backend/static

# Create uploads directory
RUN mkdir -p ./backend/uploads

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Start uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
