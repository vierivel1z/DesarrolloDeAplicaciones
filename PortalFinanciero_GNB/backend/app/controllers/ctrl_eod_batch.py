"""Proceso Batch de Fin de Día (EOD) para capitalización diaria GNB."""
from sqlalchemy.engine import Connection
from sqlalchemy import text
from decimal import Decimal
import math

def capitalizar_ahorro_rolando(conn: Connection) -> dict:
    """Capitaliza los intereses diarios de las cuentas AHORRO_ROLANDO."""
    
    # 1. Obtener las cuentas que son AHORRO_ROLANDO con su saldo más reciente
    rows = conn.execute(
        text("""
        SELECT f.pkcuentaahorro, f.montosaldodisponible, f.tasaefectivaanual
        FROM fcuentaahorro f
        JOIN dcuentaahorro d ON d.pkcuentaahorro = f.pkcuentaahorro
        WHERE d.tipo_cuenta = 'AHORRO_ROLANDO'
          AND f.periododia = (
              SELECT MAX(f2.periododia) FROM fcuentaahorro f2 WHERE f2.pkcuentaahorro = f.pkcuentaahorro
          )
        """)
    ).mappings().all()

    cuentas_actualizadas = 0
    total_intereses = Decimal('0.0')

    for row in rows:
        saldo = Decimal(row["montosaldodisponible"])
        tea = Decimal(row["tasaefectivaanual"] or 4.50)  # TEA por defecto para Rolando
        
        # Fórmula: i_d = (1 + TEA/100)^(1/360) - 1
        id_factor = Decimal(math.pow(1 + float(tea)/100.0, 1.0/360.0) - 1)
        interes_dia = round(saldo * id_factor, 2)

        if interes_dia > 0:
            nuevo_saldo = saldo + interes_dia
            conn.execute(
                text("""
                UPDATE fcuentaahorro 
                SET montosaldodisponible = :saldo,
                    montosaldocapitaltotal = :saldo
                WHERE pkcuentaahorro = :pk
                """),
                {"saldo": nuevo_saldo, "pk": row["pkcuentaahorro"]}
            )
            
            # Registrar glosa en foperaciones para auditoría
            conn.execute(
                text("""
                INSERT INTO foperaciones (
                    codtipkar, pkcuentaahorro, codkardex, pkconceptooperacion,
                    fechahoraoperacion, periododia, pktipooperacion, pkmoneda,
                    pkagenciaorigen, codtipoegresoingreso, montooperacion, glosa_operacion
                ) VALUES (
                    'AB', :pk, 'CAPITALIZACION_EOD', 1,
                    now(), to_char(now(), 'YYYYMMDD')::integer, 1, 1,
                    1, 'I', :monto, 'ABONO INTERES DIARIO ROLANDO EOD'
                )
                """),
                {"pk": row["pkcuentaahorro"], "monto": interes_dia}
            )
            
            cuentas_actualizadas += 1
            total_intereses += interes_dia

    conn.commit()

    return {
        "mensaje": "Proceso EOD Batch Finalizado Exitosamente",
        "cuentas_procesadas": cuentas_actualizadas,
        "intereses_abonados": float(total_intereses)
    }
