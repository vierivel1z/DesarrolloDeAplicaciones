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
    
    from datetime import date
    info_cli = repo_creditos.obtener_info_cliente_elegibilidad(conn, pkcliente)
    if not info_cli:
        raise HTTPException(status_code=404, detail="Cliente no encontrado para evaluación.")

    # 1. Validar Edad (23 a 80 años)
    edad = (date.today() - info_cli["fechanacimiento"]).days // 365
    if edad < 23 or edad > 80:
        raise HTTPException(status_code=400, detail=f"Edad del solicitante ({edad} años) fuera de rango permitido (23-80).")

    # 2. Validar Ingresos y Continuidad Laboral según tipo de trabajador
    tipo = info_cli.get("tipo_trabajador", "D")
    ingreso = float(montoingresoneto)
    if tipo == 'D':
        if ingreso < 1200:
            raise HTTPException(status_code=400, detail="Ingresos insuficientes para Dependiente (Mínimo S/ 1,200).")
        if info_cli.get("fecha_ingreso_laboral"):
            antiguedad = (date.today() - info_cli["fecha_ingreso_laboral"]).days
            if antiguedad < 365:
                raise HTTPException(status_code=400, detail="Continuidad laboral menor a 1 año para Dependiente.")
    elif tipo == 'I':
        if ingreso < 2500:
            raise HTTPException(status_code=400, detail="Ingresos insuficientes para Independiente (Mínimo S/ 2,500).")

    # 3. Validar Semáforo SBS
    semaforo = repo_creditos.consultar_semaforo_sbs(conn, info_cli["numerodocumentoidentidad"])
    if semaforo >= 3:
        raise HTTPException(status_code=400, detail="Crédito denegado automáticamente: Calificación SBS Riesgosa (Rojo/Pérdida).")

    # 4. Validar dinámicamente contra límites vigentes
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

def gestionar_aprobacion(conn: Connection, pksolicitud: int, tea_aprobada: Decimal, rol: str) -> dict:
    sol = conn.execute(repo_creditos.text("SELECT montosolicitudcredito, pksolicitudestado, firma_checker1_user, firma_checker2_user FROM dsolicitud WHERE pksolicitud = :pk"), {"pk": pksolicitud}).mappings().first()
    if not sol:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    monto = sol["montosolicitudcredito"]
    
    parametros = repo_parametros.obtener_parametros(conn)
    if tea_aprobada < parametros["tea_min"] or tea_aprobada > parametros["tea_max"]:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"TEA {tea_aprobada}% fuera del rango permitido ({parametros['tea_min']}% a {parametros['tea_max']}%)"
        )
        
    # Guardar TEA
    conn.execute(repo_creditos.text("UPDATE dsolicitud SET tasainterescompensatoria = :tea WHERE pksolicitud = :pk"), {"tea": tea_aprobada, "pk": pksolicitud})
    conn.commit()

    # Nivel 1 (Ruta Básica)
    if monto <= 15000:
        if rol not in ["CHECKER_1", "GERENTE_REGIONAL_RIESGOS", "SUPERADMIN"]:
            raise HTTPException(status_code=403, detail="Requiere CHECKER_1 para aprobar Nivel 1.")
        repo_creditos.registrar_firma_checker(conn, pksolicitud, 1, rol)
        repo_creditos.actualizar_estado_solicitud(conn, pksolicitud, "AL")
        return {"mensaje": "Crédito Aprobado (Nivel 1). Listo para desembolso.", "estado": "APROBADO_LISTO_DESEMBOLSO"}
    
    # Nivel 2 (Ruta Regional)
    elif monto <= 50000:
        if rol not in ["GERENTE_REGIONAL_RIESGOS", "SUPERADMIN"]:
            raise HTTPException(status_code=403, detail="Requiere Rol de GERENTE_REGIONAL_RIESGOS para Nivel 2.")
        repo_creditos.registrar_firma_checker(conn, pksolicitud, 1, rol)
        repo_creditos.actualizar_estado_solicitud(conn, pksolicitud, "AL")
        return {"mensaje": "Crédito Aprobado (Nivel 2). Listo para desembolso.", "estado": "APROBADO_LISTO_DESEMBOLSO"}
    
    # Nivel 3 (Ruta Comité de Crédito)
    else:
        if rol in ["GERENTE_REGIONAL_RIESGOS", "CHECKER_1", "SUPERADMIN"]:
            if sol["firma_checker1_user"]:
                raise HTTPException(status_code=400, detail="El Checker 1 ya firmó esta solicitud.")
            repo_creditos.registrar_firma_checker(conn, pksolicitud, 1, rol)
            repo_creditos.actualizar_estado_solicitud(conn, pksolicitud, "FC") # PENDIENTE_FIRMA_COMITE
            return {"mensaje": "Firma 1 (Riesgos) registrada. Pendiente firma Comité (Mesa de Control).", "estado": "PENDIENTE_FIRMA_COMITE"}
        elif rol in ["CHECKER_2"]:
            if not sol["firma_checker1_user"]:
                raise HTTPException(status_code=400, detail="Requiere primero la firma del Checker 1 (Riesgos).")
            repo_creditos.registrar_firma_checker(conn, pksolicitud, 2, rol)
            repo_creditos.actualizar_estado_solicitud(conn, pksolicitud, "AL")
            return {"mensaje": "Firma 2 (Mesa de Control) registrada. Crédito Aprobado (Nivel 3). Listo para desembolso.", "estado": "APROBADO_LISTO_DESEMBOLSO"}
        else:
             raise HTTPException(status_code=403, detail="Rol no autorizado para aprobar en Nivel 3.")

def desembolsar(conn: Connection, pksolicitud: int) -> dict:
    try:
        res = repo_creditos.desembolsar_solicitud(conn, pksolicitud)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
