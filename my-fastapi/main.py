from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
import requests

# -----------------------------
# Configuration
# -----------------------------
KEYCLOAK_URL = "http://localhost:8080"
REALM = "myrealm"
CLIENT_ID = "react-client"
ALGORITHMS = ["RS256"]

JWKS_URL = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/certs"
ISSUER = f"{KEYCLOAK_URL}/realms/{REALM}"

# -----------------------------
# App setup
# -----------------------------
app = FastAPI()
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Load Keycloak public keys
# -----------------------------
jwks = requests.get(JWKS_URL).json()


# -----------------------------
# Auth dependency
# -----------------------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=ALGORITHMS,
            audience=CLIENT_ID,
            issuer=ISSUER,
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


# -----------------------------
# Role checker (optional)
# -----------------------------
def require_role(role: str):
    def checker(user=Depends(get_current_user)):
        roles = user.get("realm_access", {}).get("roles", [])
        if role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden",
            )
        return user

    return checker


# -----------------------------
# Routes
# -----------------------------
@app.get("/public")
def public():
    return {"message": "This is public"}


@app.get("/protected")
def protected(user=Depends(get_current_user)):
    return {
        "username": user.get("preferred_username"),
        "roles": user.get("realm_access", {}).get("roles", []),
    }


@app.get("/admin")
def admin(user=Depends(require_role("admin"))):
    return {"message": "Welcome admin"}
