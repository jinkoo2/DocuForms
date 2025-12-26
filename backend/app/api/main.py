from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import nodes, documents, submissions, users

app = FastAPI(title="DocuForms API", version="0.1.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(nodes.router)
app.include_router(documents.router)
app.include_router(submissions.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "DocuForms API"}


@app.get("/health")
def health():
    return {"status": "healthy"}

