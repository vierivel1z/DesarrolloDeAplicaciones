"""Motor EOD (End of Day) para procesamiento de intereses pasivos de Banco GNB."""

from sqlalchemy import text
from sqlalchemy.engine import Connection

def procesar_eod_ahorros(conn: Connection) -> dict:
    """Simula el proceso Batch nocturno para cuentas de ahorro.
    Aplica el interés diario correspondiente a la Cuenta Rolando (compuesto diario)
    y a las Cuentas Tradicionales (acumulación).
    """
    
    # 1. Traer todas las cuentas activas (solo el snapshot más reciente por cuenta)
    sql_cuentas = text("""
        SELECT f.pkcuentaahorro,
               f.periododia,
               f.montosaldocapitaltotal,
               f.montosaldodisponible_ac,
               f.montointeresacuantcap_ac,
               f.tasaefectivaanual,
               dp.destiposubproducto,
               dp.destipoproducto
        FROM fcuentaahorro f
        JOIN dcuentaahorro a ON a.pkcuentaahorro = f.pkcuentaahorro
        JOIN dproductoahorro dp ON dp.pkproductoahorro = f.pkproductoahorro
        WHERE f.periododia = (
            SELECT MAX(f2.periododia) FROM fcuentaahorro f2
            WHERE f2.pkcuentaahorro = f.pkcuentaahorro
        )
    """)
    
    cuentas = conn.execute(sql_cuentas).mappings().all()
    
    cuentas_afectadas = 0
    interes_total_banco = 0.0
    
    for cuenta in cuentas:
        tea = float(cuenta["tasaefectivaanual"] or 0)
        saldo = float(cuenta["montosaldodisponible_ac"] or 0)
        
        # Si no hay saldo, no hay intereses
        if saldo <= 0:
            continue
            
        nombre_producto = (cuenta["destiposubproducto"] or "").lower()
        tipo_producto = (cuenta["destipoproducto"] or "").lower()
        
        # Asignar TEA por defecto según las reglas de GNB si la TEA está en 0
        if tea <= 0:
            if "rolando" in nombre_producto or "plus" in nombre_producto:
                tea = 4.50  # 4.50% MN
            elif "sueldo" in nombre_producto:
                tea = 1.00
            elif "cts" in tipo_producto:
                tea = 5.50
            else:
                tea = 1.00 # Base Tradicional
        
        # Factor diario de tasa (i_d) = (1 + TEA/100)^(1/360) - 1
        id_diario = ((1 + (tea / 100.0)) ** (1.0 / 360.0)) - 1
        interes_dia = round(id_diario * saldo, 2)
        
        if interes_dia <= 0:
            continue
            
        interes_total_banco += interes_dia
        cuentas_afectadas += 1
        
        nuevo_saldo = saldo
        nuevo_acumulado = float(cuenta["montointeresacuantcap_ac"] or 0)
        
        # Cuenta Rolando (o Ahorro Plus mapeado): Calcula, capitaliza y deposita diario
        if "rolando" in nombre_producto or "plus" in nombre_producto:
            nuevo_saldo += interes_dia
        else:
            # Cuentas Tradicionales, Sueldo, CTS, etc: Acumulan, NO capitalizan inmediatamente
            nuevo_acumulado += interes_dia
            
        # 2. Actualizar el registro en FCUENTAAHORRO
        # Para el simulador, actualizamos el mismo registro del último día (en un core real
        # se insertaría un nuevo registro con el periododia del nuevo día, pero 
        # actualizaremos el snapshot actual para simplicidad del prototipo).
        sql_update = text("""
            UPDATE fcuentaahorro
            SET montosaldodisponible_ac = :nuevo_saldo,
                montosaldocapitaltotal = :nuevo_saldo_total,
                montointeresacuantcap_ac = :nuevo_acumulado
            WHERE pkcuentaahorro = :pk
              AND periododia = :periododia
        """)
        
        conn.execute(sql_update, {
            "nuevo_saldo": nuevo_saldo,
            "nuevo_saldo_total": nuevo_saldo,  # Sincronizamos el total
            "nuevo_acumulado": nuevo_acumulado,
            "pk": cuenta["pkcuentaahorro"],
            "periododia": cuenta["periododia"]
        })
        
    conn.commit()
    
    return {
        "cuentas_afectadas": cuentas_afectadas,
        "interes_total_banco_pagado": round(interes_total_banco, 2)
    }
