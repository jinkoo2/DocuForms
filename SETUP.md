# DocuForms Setup Guide

## Quick Start

### 1. Environment Setup

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` and update the passwords and configuration values.

### 2. Start Services with Docker

```bash
docker compose up -d
```

This will start:
- PostgreSQL (port 5432)
- Keycloak (port 8080)
- pgAdmin (port 5050) - Web interface for PostgreSQL
- FastAPI Backend (port 8000)
- React Frontend (port 3000)

### 3. Initialize Database

```bash
docker compose exec backend python init_db.py
```

### 4. Configure Keycloak

See **KEYCLOAK_SETUP.md** for detailed step-by-step instructions.

Quick setup:
1. Access Keycloak Admin Console: http://localhost:8080
2. Login with admin credentials from `.env`
3. Create a new realm named `docuforms`
4. Create a client `docuforms-client` with these settings:
   - **Root URL**: `http://localhost:3000`
   - **Home URL**: `http://localhost:3000`
   - **Valid redirect URIs**: `http://localhost:3000/*`
   - **Valid post logout redirect URIs**: `http://localhost:3000/*`
   - **Web origins**: `http://localhost:3000`
5. Create groups: `Users` and `Admins`
6. Configure group mapper to include groups in tokens

For complete instructions, see **KEYCLOAK_SETUP.md**

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Keycloak: http://localhost:8080
- pgAdmin: http://localhost:5050 (Login: admin@docuforms.com / admin)

## Development Setup

### Frontend Development

```bash
cd frontend
npm install
npm start
```

The frontend will run on http://localhost:3000 with hot reload.

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.api.main:app --reload
```

The backend will run on http://localhost:8000 with hot reload.

## Project Structure

```
docuform/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── layout/      # Header, Footer, MainLayout
│   │   │   ├── tree/        # Tree view components
│   │   │   ├── forms/       # Form control components
│   │   │   └── editor/      # Markdown editor and renderer
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   ├── types/           # TypeScript type definitions
│   │   └── pages/           # Page components
│   ├── public/              # Static files
│   └── package.json
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   └── routes/      # Route handlers
│   │   ├── models/          # Database models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   ├── requirements.txt
│   └── init_db.py           # Database initialization script
├── docker-compose.yml        # Docker services configuration
└── README.md
```

## Key Features Implemented

### Frontend
- ✅ Three-panel layout (Tree, Content, Properties)
- ✅ Header with view/edit mode toggle
- ✅ Footer with submit button
- ✅ Tree view with CRUD operations (Admin only)
- ✅ Markdown editor for form creation
- ✅ Form controls: Text, Number, Date, Time, Dropdown, Radio, Multiple Choice
- ✅ Form validation with pass/warn/fail ranges
- ✅ Keycloak authentication integration
- ✅ Role-based UI (Admin vs User)

### Backend
- ✅ FastAPI REST API
- ✅ PostgreSQL database models
- ✅ CRUD operations for nodes and documents
- ✅ Form submission handling
- ✅ Keycloak token verification
- ✅ Role-based access control (Admin vs User)
- ✅ Document versioning

## Next Steps

1. **MDX Integration**: Currently, the form renderer uses basic markdown. To fully support MDX syntax with embedded React components, you'll need to:
   - Configure webpack/parcel to handle `.mdx` files
   - Use `@mdx-js/loader` for processing MDX files
   - Update `FormRenderer` to parse and render MDX components

2. **Enhanced Form Editing**: Add a visual form builder that allows users to:
   - Insert form controls via UI buttons
   - Configure field properties (labels, validation, etc.)
   - Preview forms in real-time

3. **Form Submission**: Complete the submission flow:
   - Connect the submit button in Footer to API
   - Add form validation before submission
   - Show success/error messages

4. **User Management**: Implement full user management in Keycloak:
   - User registration endpoint
   - Group assignment
   - User listing and editing (Admin only)

5. **Document Versioning**: Enhance versioning:
   - Show version history
   - Allow reverting to previous versions
   - Track changes between versions

## Troubleshooting

### Keycloak Connection Issues
- Ensure Keycloak is fully started (check health endpoint)
- Verify realm and client configuration
- Check token expiration settings

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env`
- Ensure database is initialized (`init_db.py`)

### CORS Issues
- Verify CORS settings in `backend/app/api/main.py`
- Check frontend API URL configuration

### Frontend Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires 18+)

## Production Deployment

For production deployment:

1. Update environment variables for production
2. Use proper SSL/TLS certificates
3. Configure Keycloak for production (use PostgreSQL, not H2)
4. Set up proper backup strategy for PostgreSQL
5. Configure reverse proxy (nginx) for frontend
6. Use environment-specific Docker images
7. Set up monitoring and logging

