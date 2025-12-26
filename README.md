# DocuForms

A web application for creating and managing markdown-based forms with embedded input fields, organized in a tree structure.

## Features

- **Tree-based Organization**: Organize forms in a hierarchical tree structure
- **Markdown Forms**: Create forms using markdown with embedded React form controls
- **Form Controls**: Text inputs, numbers, dates, dropdowns, radio buttons, multiple choice
- **Validation**: Pass/warn/fail ranges for numeric inputs, correct answer checking for discrete fields
- **User Management**: Role-based access control (Users and Admins)
- **Form Submissions**: Submit and store form responses in the database

## Tech Stack

- **Frontend**: React + TypeScript + Material UI (MUI)
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **Authentication**: Keycloak
- **Markdown**: MDX (Markdown + React components)
- **State Management**: React Query (TanStack Query)

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.10+ (for local development)

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values
3. Start the services:

```bash
docker compose up -d
```

This will start:
- PostgreSQL database
- Keycloak (authentication server)
- FastAPI backend (port 8000)
- React frontend (port 3000)

### Development

#### Frontend

```bash
cd frontend
npm install
npm start
```

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.api.main:app --reload
```

### Keycloak Setup

1. Access Keycloak admin console at http://localhost:8080
2. Login with admin credentials from `.env`
3. Create a realm named `docuforms`
4. Create a client named `docuforms-client`
5. Create groups: `Users` and `Admins`
6. Configure roles and group mappings

## Project Structure

```
docuform/
├── frontend/          # React + TypeScript frontend
├── backend/           # FastAPI backend
├── docker-compose.yml # Docker services configuration
└── README.md
```

## License

MIT

