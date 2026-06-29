"""Router de autenticación."""
from fastapi import APIRouter, Depends
from sqlalchemy.engine import Connection

from app.controllers import ctrl_auth
from app.core.cfg_database import get_db
from app.schemas.sch_auth import LoginRequest, LoginTokenRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, conn: Connection = Depends(get_db)):
    return ctrl_auth.login(conn, body.username, body.password)

@router.post("/login-token", response_model=LoginResponse)
def login_token(body: LoginTokenRequest, conn: Connection = Depends(get_db)):
    return ctrl_auth.login_token(conn, body.username, body.token)
