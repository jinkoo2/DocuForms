# Development Setup Guide

This guide explains how to run PostgreSQL and Keycloak in Docker while running the backend and frontend locally.

## Quick Start

### 1. Start PostgreSQL and Keycloak (Docker)

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL on port **5432**
- Keycloak on port **8080**
- pgAdmin on port **5050** (web interface for PostgreSQL)

### 2. Initialize Database

```bash
# Option 1: If you have Python environment set up
cd backend
python init_db.py

# Option 2: Using Docker (if backend container exists)
docker compose exec backend python init_db.py
```

### 3. Run Backend Locally

#### Option A: Using Conda (Recommended)

```bash
# Create conda environment with Python 3.11
conda create -n docuforms python=3.11

# Activate the environment
conda activate docuforms

# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://docuforms:changeme@localhost:5432/docuforms"
export KEYCLOAK_URL="http://localhost:8080"
export KEYCLOAK_REALM="docuforms"
export KEYCLOAK_CLIENT_ID="docuforms-client"

# Initialize database (if not done already)
python init_db.py

# Run the server
uvicorn app.api.main:app --reload --host 0.0.0.0 --port 8000
```

**Note:** Python 3.11 is recommended (matches Docker setup), but Python 3.10+ will work.

#### Option B: Using venv

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://docuforms:changeme@localhost:5432/docuforms"
export KEYCLOAK_URL="http://localhost:8080"
export KEYCLOAK_REALM="docuforms"
export KEYCLOAK_CLIENT_ID="docuforms-client"

# Initialize database (if not done already)
python init_db.py

# Run the server
uvicorn app.api.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**

### 4. Run Frontend Locally

**Prerequisites:** Node.js 20+ and npm must be installed. See `INSTALL_NPM.md` for installation instructions.

```bash
cd frontend
npm install

# Set environment variables (create .env file or export)
export REACT_APP_API_URL=http://localhost:8000
export REACT_APP_KEYCLOAK_URL=http://localhost:8080
export REACT_APP_KEYCLOAK_REALM=docuforms
export REACT_APP_KEYCLOAK_CLIENT_ID=docuforms-client

# Run the development server
npm start
```

Frontend will be available at: **http://localhost:3000**

## Environment Variables

### Backend (.env or export)

```bash
DATABASE_URL=postgresql://docuforms:changeme@localhost:5432/docuforms
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=docuforms
KEYCLOAK_CLIENT_ID=docuforms-client
```

### Frontend (.env file in frontend directory)

```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_KEYCLOAK_URL=http://localhost:8080
REACT_APP_KEYCLOAK_REALM=docuforms
REACT_APP_KEYCLOAK_CLIENT_ID=docuforms-client
```

### pgAdmin (optional, in .env)

```bash
PGADMIN_EMAIL=admin@docuforms.com
PGADMIN_PASSWORD=admin
```

## Useful Commands

### Docker Services

```bash
# Start services
docker compose -f docker-compose.dev.yml up -d

# Stop services
docker compose -f docker-compose.dev.yml down

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop and remove volumes (clean slate)
docker compose -f docker-compose.dev.yml down -v
```

### Database

```bash
# Connect to PostgreSQL
docker compose -f docker-compose.dev.yml exec postgres psql -U docuforms -d docuforms

# Check database status
docker compose -f docker-compose.dev.yml ps postgres
```

### Keycloak

```bash
# Access Keycloak Admin Console
# http://localhost:8080
# Login: admin / (password from .env or changeme)

# Check Keycloak status
docker compose -f docker-compose.dev.yml ps keycloak

# View Keycloak logs
docker compose -f docker-compose.dev.yml logs -f keycloak
```

### pgAdmin

```bash
# Access pgAdmin Web Interface
# http://localhost:5050
# Login: admin@docuforms.com / admin (or from .env)

# Check pgAdmin status
docker compose -f docker-compose.dev.yml ps pgadmin

# View pgAdmin logs
docker compose -f docker-compose.dev.yml logs -f pgadmin
```

**Connecting to PostgreSQL from pgAdmin:**

1. Open http://localhost:5050 and login
2. Right-click "Servers" → "Register" → "Server"
3. **General tab:**
   - Name: `DocuForms DB` (or any name)
4. **Connection tab:**
   - Host name/address: `postgres` (service name in docker-compose)
   - Port: `5432`
   - Maintenance database: `docuforms`
   - Username: `docuforms`
   - Password: `changeme` (or from `.env`)
5. Click "Save"

**Connecting to Keycloak DB from pgAdmin:**

1. Right-click "Servers" → "Register" → "Server"
2. **General tab:**
   - Name: `Keycloak DB`
3. **Connection tab:**
   - Host name/address: `keycloak-db`
   - Port: `5432`
   - Maintenance database: `keycloak`
   - Username: `keycloak`
   - Password: `changeme` (or from `.env`)
4. Click "Save"

## Troubleshooting

### Port Already in Use

If port 5432 or 8080 is already in use:

```bash
# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :8080  # Keycloak

# Or change ports in docker-compose.dev.yml
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker compose -f docker-compose.dev.yml ps postgres

# Test connection
docker compose -f docker-compose.dev.yml exec postgres psql -U docuforms -d docuforms -c "SELECT 1;"
```

### Keycloak Not Starting

Keycloak can take 30-60 seconds to fully start. Check logs:

```bash
docker compose -f docker-compose.dev.yml logs -f keycloak
```

Wait for: `Keycloak ... started in ...`

## Full Stack vs Dev Setup

- **Full Stack (docker-compose.yml)**: All services in Docker
  - Use for: Production-like testing, CI/CD
  - Run: `docker compose up`

- **Dev Setup (docker-compose.dev.yml)**: Only services in Docker
  - Use for: Local development with hot reload
  - Run: `docker compose -f docker-compose.dev.yml up -d`

