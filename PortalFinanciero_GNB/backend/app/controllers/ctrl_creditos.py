"""Controlador de créditos: solicitar crédito (ME/CO)."""
import json
import math
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.engine import Connection

from app.repositories import repo_creditos


def solicitar(
    conn: Connection,
    pkcliente: int,
    montosolicitud: Decimal,
    plazo: int,
    codtipocredito: str,
    codactividadeconomica: str,
    montoingresoneto: Decimal,
    con_seguro: bool = True,
    tipo_desgravamen: str = "estandar",
    fecha_desembolso: str | None = None,
    dia_pago: int | None = None,
) -> dict:
    if codtipocredito not in repo_creditos.MAPA_TIPO_CREDITO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de crédito fuera de alcance (solo ME o CO)",
        )
    try:
        # 1. Definir TEA Base según producto
        tea_base = Decimal('43.92') # Default fallback
        es_convenio = False
        if codtipocredito == "FACIL":
            tea_base = Decimal('8.99')
        elif codtipocredito == "LIBRE":
            tea_base = Decimal('10.50')
        elif codtipocredito == "ESTANDAR":
            tea_base = Decimal('13.00')
        elif codtipocredito == "CONVENIO":
            tea_base = Decimal('15.00')
            es_convenio = True
        elif codtipocredito == "YAPE":
            tea_base = Decimal('29.00')
            
        # 2. Calcular P(Default) log-odds (Mock betas) para Scoring
        b0, b_monto, b_ingreso, b_plazo = -2.5, 0.00005, -0.0001, 0.02
        z = b0 + (float(montosolicitud) * b_monto) + (float(montoingresoneto) * b_ingreso) + (plazo * b_plazo)
        try:
            p_default = 1 / (1 + math.exp(-z))
        except OverflowError:
            p_default = 0.0 if z < 0 else 1.0
            
        p_porcentaje = round(p_default * 100, 2)
        
        # 3. Castigo de TEA basado en Scoring (si P_default es alto, se sube la TEA)
        penalidad_riesgo = Decimal('0.00')
        if p_porcentaje > 15.0:
            penalidad_riesgo = Decimal('15.00')
        elif p_porcentaje > 5.0:
            penalidad_riesgo = Decimal('5.00')
            
        tea_final = tea_base + penalidad_riesgo
        if not con_seguro:
            tea_final += Decimal('3.00') # Si no lleva seguro tranki, se asume un aumento base por riesgo puro. (Aunque GNB exige desgravamen, esto es por si lo destilda).
            
        # 4. Simular para obtener cuota total con TEA Dinámica y el método francés
        sim = simular_credito(montosolicitud, tea_final, plazo, tipo_desgravamen=tipo_desgravamen, seguro_vida_tranki=con_seguro, es_convenio=es_convenio)
        
        # 5. Calcular RDS
        rds = (sim["cuota_total"] / montoingresoneto) * 100 if montoingresoneto > 0 else Decimal('100.0')
        
        semaforo = "Verde"
        if rds > 40:
            semaforo = "Rojo"
        elif rds > 30:
            semaforo = "Amarillo"
            
        evaluacion_dict = {
            "tea_asignada": round(float(tea_final), 2),
            "score_pd_porcentaje": p_porcentaje,
            "rds_porcentaje": round(float(rds), 2),
            "semaforo_rds": semaforo,
            "aprobado_scoring": p_porcentaje < 15.0
        }
        
        pknivelaprobacion = repo_creditos._pk_nivel_aprobacion(conn, montosolicitud)
        
        res = repo_creditos.crear_solicitud(
            conn,
            pkcliente=pkcliente,
            montosolicitud=montosolicitud,
            plazo=plazo,
            codtipocredito=codtipocredito,
            codactividadeconomica=codactividadeconomica,
            montoingresoneto=montoingresoneto,
            con_seguro=con_seguro,
            fecha_desembolso=fecha_desembolso,
            dia_pago=dia_pago,
            pknivelaprobacion=pknivelaprobacion,
            desmotivosolicitud=json.dumps(evaluacion_dict),
            tea_calculada=tea_final / 100
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return {
        "mensaje": "Solicitud registrada (En Evaluación)",
        "estado": "En Evaluación",
        "montosolicitud": montosolicitud,
        "plazo": plazo,
        "evaluacion": evaluacion_dict,
        **res,
    }


def simular_credito(
    monto: Decimal,
    tea: Decimal,
    plazo: int,
    tipo_desgravamen: str = "estandar",
    seguro_vida_tranki: bool = False,
    es_convenio: bool = False,
) -> dict:
    """
    Simula la cuota mensual de un crédito bajo el método francés,
    aplicando seguro de desgravamen, comisiones e ITF.
    """
    # Tasa efectiva mensual
    tea_float = float(tea) / 100
    im = (1 + tea_float) ** (30 / 360) - 1
    im_dec = Decimal(str(im))

    # Tasa de desgravamen
    id_tasa = Decimal("0")
    if tipo_desgravamen == "estandar":
        id_tasa = Decimal("0.000738")  # 0.0738% mensual
    elif tipo_desgravamen == "rescate":
        id_tasa = Decimal("0.00175")   # 0.175% mensual

    monto_financiar = Decimal(monto)
    
    # Seguro Vida Tranki
    if seguro_vida_tranki:
        t_vt = Decimal("0.0000148")  # 0.00148%
        dias_totales = plazo * 30
        prima_vt = monto_financiar * Decimal(dias_totales) * t_vt
        monto_financiar += prima_vt

    # Comisión por planilla
    cp = Decimal("5.00") if es_convenio else Decimal("0.00")

    # Cuota pura (Interés + Amortización)
    if im > 0 and plazo > 0:
        factor = (1 + im) ** -plazo
        cuota_pura_float = (float(monto_financiar) * im) / (1 - factor)
    else:
        cuota_pura_float = float(monto_financiar) / plazo if plazo > 0 else 0
        
    cuota_pura = Decimal(str(cuota_pura_float))

    # Seguro Desgravamen
    sd = monto_financiar * id_tasa

    # Subtotal para calcular ITF
    subtotal = cuota_pura + sd + cp
    itf = subtotal * Decimal("0.00005")

    cuota_total = subtotal + itf

    return {
        "monto_financiar": round(monto_financiar, 2),
        "cuota_pura": round(cuota_pura, 2),
        "seguro_desgravamen": round(sd, 2),
        "comision_planilla": round(cp, 2),
        "itf": round(itf, 2),
        "cuota_total": round(cuota_total, 2),
    }
