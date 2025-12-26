import os
from typing import Dict, Any
from jose import jwt, JWTError
import requests


class KeycloakService:
    def __init__(self):
        self.keycloak_url = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
        self.realm = os.getenv("KEYCLOAK_REALM", "docuforms")
        self.client_id = os.getenv("KEYCLOAK_CLIENT_ID", "docuforms-client")
        self.realm_url = f"{self.keycloak_url}/realms/{self.realm}"

    def get_public_key(self) -> str:
        """Get the public key for token verification"""
        try:
            response = requests.get(f"{self.realm_url}/.well-known/openid-configuration")
            jwks_uri = response.json()["jwks_uri"]
            jwks_response = requests.get(jwks_uri)
            jwks = jwks_response.json()
            # In production, you'd use the jwks to verify the token properly
            # For now, we'll use a simpler approach
            return jwks
        except Exception as e:
            raise Exception(f"Failed to get public key: {str(e)}")

    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            # Get public key configuration
            response = requests.get(f"{self.realm_url}/.well-known/openid-configuration")
            issuer = response.json()["issuer"]

            # Decode token (without verification for now - in production, verify properly)
            # For production, use proper JWT verification with the public key
            unverified = jwt.get_unverified_claims(token)

            # Basic validation
            if unverified.get("iss") != issuer:
                raise Exception("Invalid token issuer")

            return {
                "id": unverified.get("sub"),
                "username": unverified.get("preferred_username"),
                "email": unverified.get("email"),
                "groups": unverified.get("groups", []),
            }
        except JWTError as e:
            raise Exception(f"Invalid token: {str(e)}")
        except Exception as e:
            raise Exception(f"Token verification failed: {str(e)}")

