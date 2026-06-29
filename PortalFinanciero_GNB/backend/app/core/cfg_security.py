"""Utilidades de seguridad: hashing bcrypt directo y JWT (python-jose)."""
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.cfg_config import settings


# ---------------------------------------------------------------------------
# Passwords con bcrypt DIRECTO (NO passlib: rompe por incompatibilidad de versión)
# ---------------------------------------------------------------------------
def verificar_password(password_plano: str, password_hash: str) -> bool:
    """Compara la contraseña en texto contra el hash bcrypt almacenado."""
    try:
        return bcrypt.checkpw(password_plano.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        # Hash con formato inválido -> no autentica
        return False


def hashear_password(password_plano: str) -> str:
    """Genera un hash bcrypt (útil para crear/actualizar usuarios de prueba)."""
    return bcrypt.hashpw(password_plano.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------
def crear_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decodificar_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

# ---------------------------------------------------------------------------
# Control de Accesos por Roles (RBAC)
# ---------------------------------------------------------------------------
bearer_scheme = HTTPBearer()

class RequireRole:
    """Dependency para verificar que el usuario tenga uno de los roles permitidos."""
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> str:
        payload = decodificar_token(creds.credentials)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado",
            )
        
        role = payload.get("role")
        if not role or role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operación denegada. Se requiere uno de los roles: {', '.join(self.allowed_roles)}"
            )
        return role
