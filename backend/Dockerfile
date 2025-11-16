FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_TRUSTED_HOST="pypi.org pypi.python.org files.pythonhosted.org"

WORKDIR /app/backend

# Install system dependencies for compiled packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend project
COPY backend/ ./

# Install Python dependencies from pyproject.toml
# pip respects http_proxy/https_proxy and PIP_TRUSTED_HOST
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# Expose FastAPI port
EXPOSE 8000

# Default command: run the API server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]


