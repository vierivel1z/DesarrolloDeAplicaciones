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
        SELECT c.pkcuentacredito, dc.codcuentacredito, cli.nomcliente, cli.numerodocumentoidentidad,
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
        JOIN dcuentacredito dc ON c.pkcuentacredito = dc.pkcuentacredito
        JOIN dcliente cli ON c.pkcliente = cli.pkcliente
        WHERE c.diasatrasocredito > 0 AND c.montosaldocapital > 0
        ORDER BY c.diasatrasocredito DESC
    ''')
    return [dict(r) for r in conn.execute(sql).mappings().all()]

def registrar_gestion(conn: Connection, gestion: GestionCobranzaCreate, codpersonal: str) -> dict:
    # Obtenemos info de la cuenta a través de la solicitud
    sql_info = text('''
        SELECT c.diasatrasocredito, c.pkcliente 
        FROM fagcuentacredito c
        JOIN dsolicitud s ON c.pksolicitud = s.pksolicitud
        WHERE s.pksolicitud = :idsol
    ''')
    info = conn.execute(sql_info, {"idsol": gestion.id_solicitud}).mappings().first()
    if not info:
        raise ValueError("Solicitud o cuenta de crédito no encontrada")

    dias_atraso = info['diasatrasocredito']
    pkcliente = info['pkcliente']

    sql = text('''
        INSERT INTO fgestiones_cobranza (
            id_solicitud, usuario_gestor, canal_contacto, codigo_respuesta, comentarios, fecha_compromiso_pago, monto_comprometido
        ) VALUES (
            :idsol, :gestor, :canal, :codigo, :comentarios, :fechacomp, :monto
        ) RETURNING id_gestion
    ''')
    res = conn.execute(sql, {
        "idsol": gestion.id_solicitud,
        "gestor": codpersonal,
        "canal": gestion.canal_contacto,
        "codigo": gestion.codigo_respuesta,
        "comentarios": gestion.comentarios,
        "fechacomp": gestion.fecha_compromiso_pago,
        "monto": gestion.monto_comprometido
    }).fetchone()
    
    # Regla de negocio: pérdida irreversible de puntos si mora > 30 días
    penalizacion = False
    if dias_atraso > 30:
        conn.execute(text("UPDATE dcliente SET puntos_recompensas = 0 WHERE pkcliente = :pkcli"), {"pkcli": pkcliente})
        penalizacion = True
        
    conn.commit()
    return {
        "mensaje": "Gestión registrada exitosamente", 
        "id_gestion": res[0], 
        "penalizacion_aplicada": penalizacion
    }

def aplicar_transicion(conn: Connection, pksolicitud: int, tipo: str) -> dict:
    cc = conn.execute(text('''
        SELECT c.pkcuentacredito, c.diasatrasocredito, c.montosaldocapital,
               c.pkmoneda, c.pkagencia
        FROM fagcuentacredito c 
        JOIN dsolicitud s ON c.pksolicitud = s.pksolicitud 
        WHERE s.pksolicitud = :pk
    '''), {"pk": pksolicitud}).mappings().first()
    
    if not cc:
        raise ValueError("Cuenta no encontrada para esa solicitud")
        
    dias = cc["diasatrasocredito"]
    pkcuentacredito = cc["pkcuentacredito"]
    
    if tipo == 'judicial':
        if dias < 121:
            raise ValueError("No cumple umbral para pase judicial (mínimo 121 días)")
        conn.execute(text("UPDATE fagcuentacredito SET flagjudicial = 'S' WHERE pkcuentacredito = :pk"), {"pk": pkcuentacredito})
        conn.execute(text("UPDATE dsolicitud SET pksolicitudestado = 4 WHERE pksolicitud = :pk"), {"pk": pksolicitud})
    elif tipo == 'castigo':
        if dias <= 180:
            raise ValueError("No cumple umbral para castigo (mayor a 180 días)")
            
        # Transacción atómica
        conn.execute(text("UPDATE fagcuentacredito SET montosaldocapital = 0.0, flagcastigado = 'S' WHERE pkcuentacredito = :pk"), {"pk": pkcuentacredito})
        conn.execute(text("UPDATE dsolicitud SET pksolicitudestado = 5 WHERE pksolicitud = :pk"), {"pk": pksolicitud})
        
        # Asentar operación contable con todas las columnas obligatorias NOT NULL
        conn.execute(text('''
            INSERT INTO foperaciones (
                codtipkar, pkcuentacredito, codkardex, pkconceptooperacion,
                fechahoraoperacion, periododia, pktipooperacion, pkmoneda,
                pkagenciaorigen, codtipoegresoingreso, montopagoconcepto, montooperacion,
                glosa_operacion, fecultactualizacion
            ) VALUES (
                'DE', :pk, 'CASTIGO', 1,
                CURRENT_TIMESTAMP, 20260202, 4, :pkmon,
                :age, 'E', 0.0, :monto_castigo,
                'CASTIGO DE CARTERA CREDITICIA AUTORIZADO POR DIRECTORIO', NOW()
            )
        '''), {
            "pk": pkcuentacredito,
            "pkmon": cc["pkmoneda"] or 1,
            "age": cc["pkagencia"] or 1,
            "monto_castigo": cc["montosaldocapital"]
        })
    else:
        raise ValueError("Tipo de transición inválido")
        
    conn.commit()
    return {"mensaje": f"Cuenta transicionada a {tipo} exitosamente."}
