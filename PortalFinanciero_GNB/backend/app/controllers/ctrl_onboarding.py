"""Controlador para el Onboarding Digital de Banco GNB."""
import uuid
import random
from sqlalchemy.engine import Connection
from sqlalchemy import text
from fastapi import HTTPException
from app.core.cfg_security import hashear_password

def validar_invitacion(conn: Connection, codigo_invitacion: str) -> dict:
    row = conn.execute(
        text("""
        SELECT u.pkcliente, u.estado_registro, c.nomcliente, c.numerodocumentoidentidad, c.email
        FROM usuarios_homebanking u
        JOIN dcliente c ON c.pkcliente = u.pkcliente
        WHERE u.codigo_invitacion = :codigo
        """),
        {"codigo": codigo_invitacion}
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Código de invitación inválido o expirado")
    
    if row["estado_registro"] == 'ACTIVO':
        raise HTTPException(status_code=400, detail="Este usuario ya fue enrolado previamente.")

    return {
        "pkcliente": row["pkcliente"],
        "nombre": row["nomcliente"].strip(),
        "nro_documento": row["numerodocumentoidentidad"].strip(),
        "email": row["email"].strip()
    }

def validar_sms(conn: Connection, pkcliente: int, pin_sms: str) -> dict:
    row = conn.execute(
        text("""
        SELECT 1 FROM usuarios_homebanking 
        WHERE pkcliente = :pkc AND pin_sms = :pin AND estado_registro = 'PENDIENTE_ACTIVACION'
        """),
        {"pkc": pkcliente, "pin": pin_sms}
    ).scalar()

    if not row:
        raise HTTPException(status_code=400, detail="PIN SMS incorrecto.")
    
    return {"mensaje": "Identidad validada por SMS."}

def completar_registro(conn: Connection, pkcliente: int, username: str, password: str, sello_id: int) -> dict:
    # Verificar si el username ya existe
    dup = conn.execute(text("SELECT 1 FROM usuarios_homebanking WHERE username = :u AND pkcliente != :pkc"), {"u": username, "pkc": pkcliente}).scalar()
    if dup:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso.")

    pwd_hash = hashear_password(password)
    semilla = str(uuid.uuid4()) # Semilla simulada para el Token Digital

    conn.execute(
        text("""
        UPDATE usuarios_homebanking SET
            username = :u,
            password_hash = :p,
            sello_seguridad_id = :sello,
            token_semilla = :semilla,
            token_activado = 'S',
            estado_registro = 'ACTIVO',
            activo = 'S',
            codigo_invitacion = NULL,
            pin_sms = NULL
        WHERE pkcliente = :pkc
        """),
        {
            "u": username.lower(),
            "p": pwd_hash,
            "sello": sello_id,
            "semilla": semilla,
            "pkc": pkcliente
        }
    )
    conn.commit()

    return {"mensaje": "Registro completado con éxito. Puede iniciar sesión en Homebanking."}
