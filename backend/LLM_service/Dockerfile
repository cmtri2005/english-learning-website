FROM python:3.11-slim

WORKDIR /app

# Disable Python bytecode caching for development
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (API only, data is in MinIO)
COPY api/ ./api/

# Create __init__.py if not exists
RUN touch api/__init__.py

# Expose port
EXPOSE 8002

# Default command - run API with hot reload (use polling for Windows/WSL2 compatibility)
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8002", "--reload", "--reload-dir", "/app/api"]
