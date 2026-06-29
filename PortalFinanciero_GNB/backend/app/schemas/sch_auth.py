from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    username: str = Field(..., examples=["cli000002"])
    password: str = Field(..., examples=["demo1234"])


class LoginTokenRequest(BaseModel):
    username: str = Field(..., examples=["cli000002"])
    token: str = Field(..., examples=["token1234"])


class ClienteInfo(BaseModel):
    codcliente: str
    nombre: str
    pkcliente: int
    role: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_min: int
    cliente: ClienteInfo
