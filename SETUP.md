# Setup Guide

This guide explains how to configure environment variables for local development and Docker deployment.

## Backend Environment Variables

Create a `backend/.env` file with the following variables:

### Required API Keys

```bash
# Google API Key (required for Gemini models)
# Get one at: https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=your_google_api_key_here

# Tavily API Key (required for search functionality)
# Get one at: https://tavily.com/
TAVILY_API_KEY=your_tavily_api_key_here
```

### Optional API Keys (for enhanced functionality)

```bash
# VirusTotal API Key (optional, for enhanced entity resolution)
VIRUSTOTAL_API_KEY=

# NVD API Key (optional, for higher rate limits on CVE lookups)
NVD_API_KEY=

# GitHub Token (optional, for GitHub advisory lookups)
GITHUB_TOKEN=

# Have I Been Pwned API Key (optional, for breach data)
HIBP_API_KEY=
```

### CORS Configuration

```bash
# CORS allowed origins (comma-separated list)
# Default: http://localhost:3000,http://localhost:5173
# For production, specify your frontend domain(s):
#   CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
# To allow all origins (NOT recommended for production):
#   CORS_ORIGINS=*
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Optional Configuration

```bash
# Enable debug logging for tools
DEBUG_TOOLS=false

# Get API keys from config instead of environment
GET_API_KEYS_FROM_CONFIG=false
```

## Frontend Environment Variables

For local development, create a `frontend/.env.local` file:

```bash
# Backend API URL
# For local development: http://localhost:8000
# For VM/production: http://YOUR_VM_IP:8000 or https://api.yourdomain.com
VITE_API_URL=http://localhost:8000
```

**Note:** Vite environment variables must be prefixed with `VITE_` to be accessible in the browser.

## Docker Deployment

### Local Docker Development

For local Docker development, the defaults in `docker-compose.yaml` should work:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- CORS: Allows `http://localhost:3000` and `http://localhost:5173`

### Production/VM Deployment

When deploying to a VM or production environment:

1. **Set the frontend API URL** (as a build arg):
   ```bash
   # In docker-compose.yaml or as environment variable
   VITE_API_URL=http://YOUR_VM_IP:8000
   # Or with a domain:
   VITE_API_URL=https://api.yourdomain.com
   ```

2. **Configure CORS** in `backend/.env`:
   ```bash
   # Allow your frontend origin(s)
   CORS_ORIGINS=http://YOUR_VM_IP:3000,https://yourdomain.com
   ```

3. **Rebuild the frontend** after changing `VITE_API_URL`:
   ```bash
   docker-compose build frontend
   docker-compose up -d
   ```

## Troubleshooting CORS Issues

### Problem: Browser blocks requests with CORS error

**Solution:**
1. Check that `CORS_ORIGINS` in `backend/.env` includes your frontend URL
2. Make sure the frontend is calling the correct backend URL (not `0.0.0.0`)
3. Verify both services are running and accessible

### Problem: Frontend can't connect to backend

**Solution:**
1. For local development: Use `http://localhost:8000` (not `0.0.0.0:8000`)
2. For VM deployment: Use the VM's external IP or domain name
3. Check firewall rules allow traffic on ports 8000 and 3000
4. Verify the backend is bound to `0.0.0.0:8000` (not just `127.0.0.1`)

### Problem: Mixed Content errors (HTTPS frontend, HTTP backend)

**Solution:**
1. Use HTTPS for both frontend and backend
2. Or use HTTP for both (development only)
3. Set up a reverse proxy (nginx) with SSL certificates

## Quick Start

1. **Backend setup:**
   ```bash
   cd backend
   cp .env.example .env  # Create from template if available
   # Edit .env and add your API keys
   ```

2. **Frontend setup (local dev):**
   ```bash
   cd frontend
   echo "VITE_API_URL=http://localhost:8000" > .env.local
   ```

3. **Docker setup:**
   ```bash
   # Set environment variables
   export VITE_API_URL=http://localhost:8000
   export CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   
   # Build and run
   docker-compose up --build
   ```

