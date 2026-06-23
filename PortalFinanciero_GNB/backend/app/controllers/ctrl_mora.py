from decimal import Decimal
from datetime import date
from sqlalchemy.engine import Connection
from sqlalchemy import text
from app.schemas.sch_mora import GestionCobranzaCreate

def _clasificar_categoria_sbs(dias_atraso: int) -> int:
    if dias_atraso <= 8: return 0
    elif dias_atraso <= 30: return 1
    elif dias_atraso <= 60: return 2
    elif dias_atraso <= 120: return 3
    else: return 4

def procesar_fin_de_dia_mora(conn: Connection) -> dict:
    """Ejecuta el Cron Job EOD de Mora para actualizar estados e intereses."""
    sql_cuotas = text('''
        SELECT periodomes, pkcuentacredito, nrocuota, fechavencimientopagocuota,
               montocapitalprogramado, montocapitalpagado,
               montointeresprogramado, tasainteresmoratoria, diasvencidocuota, pkcliente
        FROM fplanpagomes
        WHERE codestadocuota IN ('PE', 'VE') AND fechavencimientopagocuota < CURRENT_DATE
    ''')
    
    cuotas = conn.execute(sql_cuotas).mappings().all()
    
    procesadas = 0
    hoy = date.today()
    
    for c in cuotas:
        dias_atraso = (hoy - c['fechavencimientopagocuota']).days
        if dias_atraso <= 0: continue
        
        # 1. Calcular Interés Moratorio acumulado
        capital_amortizado = c['montocapitalprogramado'] - c['montocapitalpagado']
        tasa_mora_anual = c['tasainteresmoratoria'] or Decimal('0.155')
        
        # IM = (i_mora * t / 360) * A_v
        interes_mora = (tasa_mora_anual * Decimal(dias_atraso) / Decimal(360)) * capital_amortizado
        
        # 2. Actualizar la cuota
        conn.execute(
            text('''
            UPDATE fplanpagomes 
            SET diasvencidocuota = :dias, montomoraprogramado = :mora, codestadocuota = 'VE', fecultactualizacion = NOW()
            WHERE periodomes = :pm AND pkcuentacredito = :pkcc AND nrocuota = :nc
            '''),
            {"dias": dias_atraso, "mora": round(interes_mora, 2), "pm": c['periodomes'], "pkcc": c['pkcuentacredito'], "nc": c['nrocuota']}
        )
        
        # Actualizar cuenta credito
        conn.execute(
            text('''
            UPDATE fagcuentacredito
            SET diasatrasocredito = GREATEST(diasatrasocredito, :dias), fecultactualizacion = NOW()
            WHERE pkcuentacredito = :pkcc
            '''),
            {"dias": dias_atraso, "pkcc": c['pkcuentacredito']}
        )
        
        # 3. Categoría SBS
        nueva_categoria = _clasificar_categoria_sbs(dias_atraso)
        
        conn.execute(
            text('''
            UPDATE dcliente
            SET pkcalificacioncrediticiainterna = :cat, fecultactualizacion = NOW()
            WHERE pkcliente = :pkcli
            '''),
            {"cat": nueva_categoria, "pkcli": c['pkcliente']}
        )
        procesadas += 1

    conn.commit()
    return {"mensaje": f"Proceso EOD completado. {procesadas} cuotas vencidas procesadas y penalizadas."}

def listar_cartera_mora(conn: Connection) -> list[dict]:
    sql = text('''
        SELECT c.pkcuentacredito, c.codcuentacredito, cli.nomcliente, cli.numerodocumentoidentidad,
               c.diasatrasocredito, c.montosaldocapital, c.flagjudicial, c.flagcastigado,
               CASE
                   WHEN c.flagcastigado = 'S' THEN 'Castigo'
                   WHEN c.flagjudicial = 'S' THEN 'Judicial'
                   WHEN c.diasatrasocredito <= 8 THEN 'Preventiva'
                   WHEN c.diasatrasocredito <= 30 THEN 'Temprana'
                   WHEN c.diasatrasocredito <= 120 THEN 'Tardía'
                   ELSE 'Tardía'
               END as banda
        FROM fagcuentacredito c
        JOIN dcliente cli ON c.pkcliente = cli.pkcliente
        WHERE c.diasatrasocredito > 0 AND c.montosaldocapital > 0
        ORDER BY c.diasatrasocredito DESC
    ''')
    return [dict(r) for r in conn.execute(sql).mappings().all()]

def registrar_gestion(conn: Connection, gestion: GestionCobranzaCreate, codpersonal: str) -> dict:
    sql = text('''
        INSERT INTO fgestioncobranza (
            pkcuentacredito, pktipogestion, fechagestion, diasatrasoalmomento,
            gestor, resultado, compromisopago, montocomprometido, fecultactualizacion
        ) VALUES (
            :pkcc, :pktg, CURRENT_DATE,
            (SELECT diasatrasocredito FROM fagcuentacredito WHERE pkcuentacredito = :pkcc LIMIT 1),
            :gestor, :res, :comp, :monto, NOW()
        ) RETURNING pkgestion
    ''')
    res = conn.execute(sql, {
        "pkcc": gestion.pkcuentacredito,
        "pktg": gestion.pktipogestion,
        "gestor": codpersonal,
        "res": gestion.resultado,
        "comp": gestion.compromisopago,
        "monto": gestion.montocomprometido
    }).fetchone()
    conn.commit()
    return {"mensaje": "Gestión registrada exitosamente", "pkgestion": res[0]}

def aplicar_transicion(conn: Connection, pkcuentacredito: int, tipo: str) -> dict:
    cc = conn.execute(text("SELECT diasatrasocredito FROM fagcuentacredito WHERE pkcuentacredito = :pk"), {"pk": pkcuentacredito}).mappings().first()
    if not cc:
        raise ValueError("Cuenta no encontrada")
        
    dias = cc["diasatrasocredito"]
    
    if tipo == 'judicial':
        if dias < 121:
            raise ValueError("No cumple umbral para pase judicial (mínimo 121 días)")
        conn.execute(text("UPDATE fagcuentacredito SET flagjudicial = 'S' WHERE pkcuentacredito = :pk"), {"pk": pkcuentacredito})
    elif tipo == 'castigo':
        if dias <= 180:
            raise ValueError("No cumple umbral para castigo (mayor a 180 días)")
        conn.execute(text("UPDATE fagcuentacredito SET flagcastigado = 'S' WHERE pkcuentacredito = :pk"), {"pk": pkcuentacredito})
    else:
        raise ValueError("Tipo de transición inválido")
        
    conn.commit()
    return {"mensaje": f"Cuenta transicionada a {tipo} exitosamente."}
