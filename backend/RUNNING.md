# Running the Backend

## Option 1: Docker Compose (Recommended)

The easiest way to run the backend is using Docker Compose, which will also start PostgreSQL and Keycloak:

```bash
# From the project root directory
docker compose up backend
```

Or to run all services (backend, frontend, postgres, keycloak):
```bash
docker compose up
```

The backend will be available at: http://localhost:8000
API docs at: http://localhost:8000/docs

**Important:** After starting, initialize the database:
```bash
docker compose exec backend python init_db.py
```

## Option 2: Local Development

For local development with hot reload:

### Prerequisites
- Python 3.10 or higher
- PostgreSQL running locally (or use Docker for just the database)

### Steps

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set environment variables:**
Create a `.env` file in the backend directory or export:
```bash
export DATABASE_URL="postgresql://docuforms:changeme@localhost:5432/docuforms"
export KEYCLOAK_URL="http://localhost:8080"
export KEYCLOAK_REALM="docuforms"
export KEYCLOAK_CLIENT_ID="docuforms-client"
```

4. **Initialize database:**
```bash
python init_db.py
```

5. **Run the server:**
```bash
uvicorn app.api.main:app --reload --host 0.0.0.0 --port 8000
```

The `--reload` flag enables hot reload for development.

## Using Just the Dockerfile

If you want to build and run just the backend container (without docker compose):

```bash
# Build the image
docker build -t docuforms-backend ./backend

# Run the container (requires PostgreSQL and Keycloak to be running)
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://docuforms:changeme@host.docker.internal:5432/docuforms" \
  -e KEYCLOAK_URL="http://host.docker.internal:8080" \
  -e KEYCLOAK_REALM="docuforms" \
  -e KEYCLOAK_CLIENT_ID="docuforms-client" \
  docuforms-backend
```

**Note:** This approach requires PostgreSQL and Keycloak to be accessible. Using `docker compose` is easier as it manages all services together.

## Quick Start (Recommended)

```bash
# 1. Start all services
docker compose up -d

# 2. Initialize database
docker compose exec backend python init_db.py

# 3. Check logs
docker compose logs -f backend

# 4. Access API
# http://localhost:8000/docs
```

## Troubleshooting

### Database connection errors
- Ensure PostgreSQL is running and accessible
- Check `DATABASE_URL` environment variable
- Verify database exists: `docker compose exec postgres psql -U docuforms -d docuforms`

### Keycloak connection errors
- Ensure Keycloak is running: `docker compose ps keycloak`
- Check Keycloak health: `curl http://localhost:8080/health`
- Verify Keycloak is fully started (may take 30-60 seconds)

### Port already in use
- Change the port in docker compose.yml or use: `docker compose up -p 8001:8000 backend`

