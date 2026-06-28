"""Controlador de créditos: Flujo completo GNB."""
import math
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.engine import Connection

from app.repositories import repo_creditos, repo_parametros

def solicitar(
    conn: Connection,
    pkcliente: int,
    montosolicitud: Decimal,
    plazo: int,
    codtipocredito: str,
    codactividadeconomica: str,
    montoingresoneto: Decimal,
    archivo_sustento_url: str
) -> dict:
    
    # Validar dinámicamente contra límites vigentes
    parametros = repo_parametros.obtener_parametros(conn)
    if montosolicitud < parametros["monto_min_pen"] or montosolicitud > parametros["monto_max_pen"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Monto fuera de límites permitidos (S/ {parametros['monto_min_pen']} a S/ {parametros['monto_max_pen']})"
        )

    try:
        res = repo_creditos.crear_solicitud(
            conn,
            pkcliente=pkcliente,
            montosolicitud=montosolicitud,
            plazo=plazo,
            codtipocredito=codtipocredito,
            codactividadeconomica=codactividadeconomica,
            montoingresoneto=montoingresoneto,
            archivo_sustento_url=archivo_sustento_url,
            con_seguro=True
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return {
        "mensaje": "Solicitud registrada (En Evaluación)",
        "estado": "En Evaluación",
        "monto": montosolicitud,
        "plazo": plazo,
        **res,
    }

def evaluar_credito(
    conn: Connection, pksolicitud: int, score_pd: Decimal, ingreso_neto: Decimal, comentarios: str
) -> dict:
    # 1. Obtener datos de la solicitud
    sol = conn.execute(repo_creditos.text("SELECT * FROM dsolicitud WHERE pksolicitud = :pk"), {"pk": pksolicitud}).mappings().first()
    if not sol:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    monto = sol["montosolicitudcredito"]
    plazo = sol["plazosolicitudcredito"]

    # Usamos una TEA referencial para la evaluación inicial si no tiene (ej. la mínima)
    parametros = repo_parametros.obtener_parametros(conn)
    tea_ref = parametros["tea_min"]

    # Fórmulas
    im = (1 + float(tea_ref)/100.0)**(30.0/360.0) - 1
    
    if im > 0 and plazo > 0:
        cuota_pura = (float(monto) * im) / (1 - (1 + im)**(-plazo))
    else:
        cuota_pura = float(monto) / plazo
        
    tasa_sd = 0.000738
    tasa_itf = 0.00005
    sd = float(monto) * tasa_sd
    itf = (cuota_pura + sd) * tasa_itf
    c = cuota_pura + sd + itf

    dti = (c / float(ingreso_neto)) * 100

    if dti > 40.0:
        raise HTTPException(status_code=400, detail="Rechazado: Capacidad de endeudamiento excedida")

    repo_creditos.actualizar_evaluacion_solicitud(conn, pksolicitud, score_pd, Decimal(dti), comentarios)

    return {
        "mensaje": "Evaluación exitosa. Estado actualizado a EVALUADA_PENDIENTE_FIRMA",
        "score_pd": score_pd,
        "dti_ratio": round(dti, 2),
        "cuota_estimada": round(c, 2)
    }

def asignar_tea_y_otp(conn: Connection, pksolicitud: int, tea_aprobada: Decimal) -> dict:
    parametros = repo_parametros.obtener_parametros(conn)
    if tea_aprobada < parametros["tea_min"] or tea_aprobada > parametros["tea_max"]:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"TEA {tea_aprobada}% fuera del rango permitido ({parametros['tea_min']}% a {parametros['tea_max']}%)"
        )

    otp = repo_creditos.asignar_tea_y_otp(conn, pksolicitud, tea_aprobada)
    return {
        "mensaje": "TEA asignada y OTP generado",
        "otp": otp, # En producción esto no se retorna, se enviaría por email
        "estado": "ESPERANDO_FIRMA_CLIENTE"
    }

def validar_otp(conn: Connection, pksolicitud: int, otp_ingresado: str) -> dict:
    ok = repo_creditos.validar_otp_cliente(conn, pksolicitud, otp_ingresado)
    if not ok:
        raise HTTPException(status_code=400, detail="OTP incorrecto")
    return {"mensaje": "Contrato firmado exitosamente", "estado": "APROBADO_LISTO_DESEMBOLSO"}

def desembolsar(conn: Connection, pksolicitud: int) -> dict:
    try:
        res = repo_creditos.desembolsar_solicitud(conn, pksolicitud)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
