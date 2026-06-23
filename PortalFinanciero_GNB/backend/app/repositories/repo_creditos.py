"""Escrituras SQL para solicitar un crédito (registro en dsolicitud).

Alcance: solo Microempresa (ME) y Consumo (CO).
"""
from decimal import Decimal
import math
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

from sqlalchemy import text
from sqlalchemy.engine import Connection

from app.repositories.repo_cuentas import PERIODO_CARTERA

# codtipocredito del portal -> codtipocredito en dproducto
MAPA_TIPO_CREDITO = {"ME": "01", "CO": "03"}  # ME=Microempresa, CO=Consumo
ESTADO_EN_EVALUACION = "01"  # dsolicitudestado.codsolicitudestado

def listar_solicitudes(conn: Connection) -> list[dict]:
    """Lista todas las solicitudes de crédito."""
    sql = text(
        """
        SELECT s.pksolicitud as id, s.codsolicitud, s.pkcliente, c.nomcliente, c.numerodocumentoidentidad,
               s.montosolicitudcredito as monto, s.plazosolicitudcredito as plazo, s.fechasolicitudcredito as fecha,
               e.dessolicitudestado as estado, s.pksolicitudestado
        FROM dsolicitud s
        JOIN dcliente c ON c.pkcliente = s.pkcliente
        JOIN dsolicitudestado e ON e.pksolicitudestado = s.pksolicitudestado
        ORDER BY s.pksolicitud DESC
        """
    )
    return [dict(r) for r in conn.execute(sql).mappings().all()]


def _pk_producto_por_tipo(conn: Connection, cod_tipo_producto: str) -> int | None:
    return conn.execute(
        text(
            """
            SELECT MIN(pkproducto) FROM dproducto
            WHERE TRIM(codtipocredito) = :cod AND flagactivo = '1'
            """
        ),
        {"cod": cod_tipo_producto},
    ).scalar()


def _pk_estado_solicitud(conn: Connection, cod: str) -> int | None:
    return conn.execute(
        text("SELECT pksolicitudestado FROM dsolicitudestado WHERE TRIM(codsolicitudestado) = :c"),
        {"c": cod},
    ).scalar()


def _pk_actividad(conn: Connection, cod: str) -> int | None:
    return conn.execute(
        text("SELECT pkactividadeconomica FROM dactividadeconomica WHERE TRIM(codactividadeconomica) = :c"),
        {"c": cod},
    ).scalar()


def _agencia_asesor_del_cliente(conn: Connection, pkcliente: int) -> tuple[int, int]:
    """Toma agencia/asesor del crédito vigente del cliente; si no tiene, usa valores por defecto."""
    row = conn.execute(
        text(
            """
            SELECT pkagencia, pkasesor FROM fagcuentacredito
            WHERE pkcliente = :pk AND periodomes = :periodo
            ORDER BY pkcuentacredito DESC LIMIT 1
            """
        ),
        {"pk": pkcliente, "periodo": PERIODO_CARTERA},
    ).first()
    if row:
        return row[0], row[1]
    # Fallback: primera agencia activa y primer asesor existentes
    pkag = conn.execute(text("SELECT MIN(pkagencia) FROM dagencia")).scalar()
    pkas = conn.execute(text("SELECT MIN(pkasesor) FROM dasesor")).scalar()
    return pkag, pkas


def upsert_fuente_ingreso(
    conn: Connection, pkcliente: int, montoingresoneto: Decimal, pkactividad: int | None
) -> None:
    """Registra el ingreso del cliente (PK compuesta pkcliente+periodomes) de forma idempotente."""
    conn.execute(
        text(
            """
            INSERT INTO fclientefuenteingreso (pkcliente, periodomes, montofuenteingreso,
                                               pkactividadeconomicacliente, fecultactualizacion)
            VALUES (:pk, :periodo, :monto, :act, now())
            ON CONFLICT (pkcliente, periodomes)
            DO UPDATE SET montofuenteingreso = EXCLUDED.montofuenteingreso,
                          pkactividadeconomicacliente = EXCLUDED.pkactividadeconomicacliente,
                          fecultactualizacion = now()
            """
        ),
        {"pk": pkcliente, "periodo": PERIODO_CARTERA, "monto": montoingresoneto, "act": pkactividad},
    )


def crear_solicitud(
    conn: Connection,
    pkcliente: int,
    montosolicitud: Decimal,
    plazo: int,
    codtipocredito: str,
    codactividadeconomica: str,
    montoingresoneto: Decimal,
    con_seguro: bool = True,
    fecha_desembolso: str | None = None,
    dia_pago: int | None = None,
) -> dict:
    """Registra una solicitud en dsolicitud (estado inicial 'En Evaluación').

    pksolicitud proviene de dsolicitud_pksolicitud_seq y codsolicitud se deriva
    con 'SOL' || LPAD(currval(...)::text, 7, '0').
    """
    tea = Decimal('0.4092') if con_seguro else Decimal('0.4392')
    cod_tipo_producto = MAPA_TIPO_CREDITO[codtipocredito]
    pkproducto = _pk_producto_por_tipo(conn, cod_tipo_producto)
    if pkproducto is None:
        raise ValueError(f"No hay producto activo para el tipo de crédito '{codtipocredito}'")

    pkestado = _pk_estado_solicitud(conn, ESTADO_EN_EVALUACION)
    if pkestado is None:
        raise ValueError("No existe el estado 'En Evaluación' en dsolicitudestado")

    pkactividad = _pk_actividad(conn, codactividadeconomica)
    if pkactividad is None:
        raise ValueError(f"Actividad económica '{codactividadeconomica}' no encontrada")

    pkmoneda = conn.execute(
        text("SELECT pkmoneda FROM dmoneda WHERE TRIM(codmoneda) = 'SO'")
    ).scalar()
    pkagencia, pkasesor = _agencia_asesor_del_cliente(conn, pkcliente)

    # Registra/actualiza la fuente de ingreso (idempotente) antes de la solicitud.
    upsert_fuente_ingreso(conn, pkcliente, montoingresoneto, pkactividad)

    row = conn.execute(
        text(
            """
            INSERT INTO dsolicitud (
                pksolicitud, codsolicitud, pkcliente, codlineacredito,
                pksolicitudestado, pkmoneda, pkproducto,
                codtiposolicitud, destiposolicitud,
                montosolicitudcredito, nrocuotasolicitud, plazosolicitudcredito,
                fechasolicitudcredito, codususol,
                flaglibreamortizacioncredito, nrodiasgracia,
                pkactividadeconomicasolicitud, pkagencia, pkasesor,
                tasainterescompensatoria, diafechafija, fechaaprobacioncredito,
                fechahoracreacion, fechahoraultmodificacion, fecultactualizacion
            ) VALUES (
                nextval('dsolicitud_pksolicitud_seq'),
                'SOL' || LPAD(currval('dsolicitud_pksolicitud_seq')::text, 7, '0'),
                :pkcliente, 'CR',
                :pkestado, :pkmoneda, :pkproducto,
                '01', 'Credito Nuevo',
                :monto, :plazo, :plazo,
                CURRENT_DATE, 'HB',
                'N', 0,
                :pkactividad, :pkagencia, :pkasesor,
                :tea, :dia_pago, :fecha_desembolso,
                now(), now(), now()
            )
            RETURNING pksolicitud, codsolicitud
            """
        ),
        {
            "pkcliente": pkcliente,
            "pkestado": pkestado,
            "pkmoneda": pkmoneda,
            "pkproducto": pkproducto,
            "monto": montosolicitud,
            "plazo": plazo,
            "pkactividad": pkactividad,
            "pkagencia": pkagencia,
            "pkasesor": pkasesor,
            "tea": tea,
            "dia_pago": dia_pago,
            "fecha_desembolso": datetime.strptime(fecha_desembolso, "%Y-%m-%d").date() if fecha_desembolso else None,
        },
    ).mappings().first()
    conn.commit()
    return {"pksolicitud": row["pksolicitud"], "codsolicitud": row["codsolicitud"].strip()}

def evaluar_solicitud(conn: Connection, pksolicitud: int) -> dict:
    """Genera cronograma preliminar y aprueba solicitud."""
    # Obtenemos datos de la solicitud
    sol = conn.execute(
        text("SELECT * FROM dsolicitud WHERE pksolicitud = :pk"),
        {"pk": pksolicitud}
    ).mappings().first()
    if not sol:
        raise ValueError("Solicitud no encontrada")

    pkestado_aprobado = _pk_estado_solicitud(conn, "02") # 02 = Aprobado (asumiendo) o actualizamos a mano
    if not pkestado_aprobado:
        # Fallback al string '02' si no hay funcion
        pkestado_aprobado = conn.execute(text("SELECT pksolicitudestado FROM dsolicitudestado WHERE codsolicitudestado='02'")).scalar()
    
    conn.execute(
        text("UPDATE dsolicitud SET pksolicitudestado = :est WHERE pksolicitud = :pk"),
        {"est": pkestado_aprobado, "pk": pksolicitud}
    )

    tea = sol["tasainterescompensatoria"] or Decimal('0.4392')
    monto = sol["montosolicitudcredito"]
    plazo = sol["plazosolicitudcredito"]
    dia_pago = sol["diafechafija"] or 1
    fecha_desembolso = sol["fechaaprobacioncredito"] or date.today()

    # Cálculo TEM y Cuota Fija Francesa
    tem = Decimal(math.pow(1 + float(tea), 1/12.0) - 1)
    if tem == 0:
        cuota = monto / plazo
    else:
        cuota = monto * (tem * Decimal(math.pow(1 + float(tem), plazo))) / (Decimal(math.pow(1 + float(tem), plazo)) - 1)
    cuota = round(cuota, 2)

    cronograma = []
    saldo = monto
    fecha_pago = fecha_desembolso
    # Ir al primer mes
    for _ in range(plazo):
        # Avanzar 1 mes
        fecha_pago = fecha_pago + relativedelta(months=1)
        # Ajustar día de pago
        try:
            fecha_pago = fecha_pago.replace(day=dia_pago)
        except ValueError:
            # Si el día es 31 y el mes tiene 30, ir al último día del mes
            fecha_pago = fecha_pago + relativedelta(day=31)

        interes = round(saldo * tem, 2)
        capital = cuota - interes
        if saldo - capital < 0:
            capital = saldo
            cuota = capital + interes
            saldo = Decimal(0)
        else:
            saldo -= capital

        cronograma.append({
            "nrocuota": len(cronograma) + 1,
            "fecha_vencimiento": fecha_pago.strftime("%Y-%m-%d"),
            "monto_cuota": cuota,
            "capital": capital,
            "interes": interes,
            "saldo_capital": saldo
        })
    conn.commit()
    return {"cronograma": cronograma, "monto_total": sum(c["monto_cuota"] for c in cronograma)}

def desembolsar_solicitud(conn: Connection, pksolicitud: int) -> dict:
    """Crea la cuenta de crédito, el cronograma en fplanpagomes y abona al ahorro."""
    sol = conn.execute(
        text("SELECT * FROM dsolicitud WHERE pksolicitud = :pk"),
        {"pk": pksolicitud}
    ).mappings().first()
    if not sol:
        raise ValueError("Solicitud no encontrada")

    pkestado_desembolsado = conn.execute(text("SELECT pksolicitudestado FROM dsolicitudestado WHERE codsolicitudestado='03'")).scalar()
    conn.execute(text("UPDATE dsolicitud SET pksolicitudestado = :est WHERE pksolicitud = :pk"), {"est": pkestado_desembolsado, "pk": pksolicitud})

    # Crear cuenta credito
    row_credito = conn.execute(
        text("INSERT INTO dcuentacredito (codcuentacredito, codlineacredito, pkcliente) VALUES ('CRE' || :pk, 'CR', :cli) RETURNING pkcuentacredito"),
        {"pk": pksolicitud, "cli": sol["pkcliente"]}
    ).first()
    pkcuentacredito = row_credito[0]

    eval_result = evaluar_solicitud(conn, pksolicitud)
    cronograma = eval_result["cronograma"]

    # Fplanpagomes
    pkmoneda = sol["pkmoneda"]
    pkproducto = sol["pkproducto"]
    pkcliente = sol["pkcliente"]
    pkagencia = sol["pkagencia"]
    pkasesor = sol["pkasesor"]

    # fagcuentacredito
    fecha_desembolso = sol["fechaaprobacioncredito"] or date.today()
    tea = sol["tasainterescompensatoria"] or Decimal('0.4392')

    conn.execute(
        text('''
        INSERT INTO fagcuentacredito (
            periodomes, pkcuentacredito, pksolicitud, pkestadocredito, nrocuotas,
            montoaprobadocredito, montocapitaldesembolsado, pkproducto, pkmoneda,
            tasainterescompensatoria, tasainteresmoratoria, fechadesembolsocredito,
            pkcliente, pkagencia, pkasesor, montosaldocapital, montosaldocliente
        ) VALUES (
            :periodo, :pkcc, :pksol, 1, :plazo,
            :monto, :monto, :pkprod, :pkmon,
            :tea, 0.0, :fechades,
            :cli, :age, :ase, :monto, :monto
        )
        '''),
        {
            "periodo": PERIODO_CARTERA, "pkcc": pkcuentacredito, "pksol": pksolicitud, "plazo": sol["plazosolicitudcredito"],
            "monto": sol["montosolicitudcredito"], "pkprod": pkproducto, "pkmon": pkmoneda,
            "tea": tea, "fechades": fecha_desembolso, "cli": pkcliente, "age": pkagencia, "ase": pkasesor
        }
    )

    for c in cronograma:
        conn.execute(
            text('''
            INSERT INTO fplanpagomes (
                periodomes, pkcuentacredito, codplanpago, nrocuota, pksolicitud,
                pkestadocredito, pkproducto, pkmoneda, pkcliente, pkagencia, pkasesor,
                fechavencimientopagocuota, montocuota, montosaldo,
                montointeresprogramado, montocapitalprogramado, montosaldocapital
            ) VALUES (
                :periodo, :pkcc, :cod, :nro, :pksol,
                1, :pkprod, :pkmon, :cli, :age, :ase,
                :fechaven, :cuota, :cuota,
                :interes, :capital, :saldocap
            )
            '''),
            {
                "periodo": PERIODO_CARTERA, "pkcc": pkcuentacredito, "cod": f"P{pksolicitud}-{c['nrocuota']}",
                "nro": c['nrocuota'], "pksol": pksolicitud, "pkprod": pkproducto, "pkmon": pkmoneda,
                "cli": pkcliente, "age": pkagencia, "ase": pkasesor,
                "fechaven": c["fecha_vencimiento"], "cuota": c["monto_cuota"],
                "interes": c["interes"], "capital": c["capital"], "saldocap": c["saldo_capital"]
            }
        )

    # Abono a cuenta de ahorros
    cuenta_ahorro = conn.execute(
        text("SELECT pkcuentaahorro FROM dcuentaahorro WHERE pkcliente = :cli LIMIT 1"),
        {"cli": pkcliente}
    ).scalar()
    
    if cuenta_ahorro:
        conn.execute(
            text("UPDATE fcuentaahorro SET montosaldocapitaltotal = montosaldocapitaltotal + :monto WHERE pkcuentaahorro = :pkah"),
            {"monto": sol["montosolicitudcredito"], "pkah": cuenta_ahorro}
        )
        conn.execute(
            text('''
            INSERT INTO foperaciones (
                codtipkar, pkcuentacredito, pkcuentaahorro, codkardex, pkconceptooperacion,
                fechahoraoperacion, periododia, pktipooperacion, pkmoneda,
                pkagenciaorigen, codtipoegresoingreso, montooperacion
            ) VALUES (
                'DE', :pkcc, :pkah, 'DESEMBOLSO', 1,
                now(), 20260202, 1, :pkmon,
                :age, 'I', :monto
            )
            '''),
            {
                "pkcc": pkcuentacredito, "pkah": cuenta_ahorro, "pkmon": pkmoneda, "age": pkagencia,
                "monto": sol["montosolicitudcredito"]
            }
        )

    conn.commit()
    return {"mensaje": "Crédito desembolsado exitosamente", "pkcuentacredito": pkcuentacredito}


def obtener_detalle_solicitud(conn: Connection, pksolicitud: int) -> dict:
    """Retorna el detalle completo de una solicitud de crédito, incluyendo perfil de riesgo del cliente."""
    # 1. Obtener la solicitud
    sql_sol = text(
        """
        SELECT s.pksolicitud as id, s.codsolicitud, s.pkcliente,
               s.montosolicitudcredito as monto, s.plazosolicitudcredito as plazo,
               s.fechasolicitudcredito as fecha, s.tasainterescompensatoria as tea,
               s.diafechafija as dia_pago, s.fechaaprobacioncredito as fecha_desembolso,
               s.destiposolicitud, s.pksolicitudestado, e.dessolicitudestado as estado,
               p.destipoproducto as producto_tipo, p.destiposubproducto as producto_subtipo,
               s.pkactividadeconomicasolicitud as pkactividad
        FROM dsolicitud s
        JOIN dsolicitudestado e ON e.pksolicitudestado = s.pksolicitudestado
        JOIN dproducto p ON p.pkproducto = s.pkproducto
        WHERE s.pksolicitud = :pk
        """
    )
    sol_row = conn.execute(sql_sol, {"pk": pksolicitud}).mappings().first()
    if not sol_row:
        raise ValueError("Solicitud no encontrada")
        
    sol = dict(sol_row)
    pkcliente = sol["pkcliente"]

    # 2. Obtener el cliente
    sql_cli = text(
        """
        SELECT pkcliente, TRIM(codcliente) as codcliente, TRIM(nomcliente) as nombre,
               numerodocumentoidentidad as nro_documento, email, numerotelefonopersonal as telefono,
               montoingresoneto, pkactividadeconomica
        FROM dcliente
        WHERE pkcliente = :pkcliente
        """
    )
    cli_row = conn.execute(sql_cli, {"pkcliente": pkcliente}).mappings().first()
    if not cli_row:
        raise ValueError("Cliente no encontrado")
    cli = dict(cli_row)

    # 3. Obtener actividad económica
    sql_act = text("SELECT desactividadeconomica FROM dactividadeconomica WHERE pkactividadeconomica = :pk")
    act_desc = conn.execute(sql_act, {"pk": sol["pkactividad"] or cli["pkactividadeconomica"]}).scalar()
    cli["actividad_desc"] = act_desc or "No especificada"

    # 4. Deuda total y calificación SBS
    sql_deuda = text(
        """
        SELECT 
            COALESCE(SUM(fa.montosaldocliente), 0) AS deuda_total,
            MAX(fa.pkcalificacioncrediticiainterna) AS worst_cal_pk
        FROM fagcuentacredito fa
        WHERE fa.pkcliente = :pkcliente AND fa.periodomes = :periodo
        """
    )
    deuda_row = conn.execute(sql_deuda, {"pkcliente": pkcliente, "periodo": PERIODO_CARTERA}).first()
    deuda_total = float(deuda_row[0]) if deuda_row else 0.0
    worst_cal_pk = deuda_row[1] if deuda_row else None

    calificacion_desc = "Normal"
    calificacion_code = "0"
    if worst_cal_pk:
        sql_cal = text(
            """
            SELECT codcalificacioncrediticia, descalificacioncrediticia
            FROM dcalificacioncrediticia
            WHERE pkcalificacioncrediticia = :pk
            """
        )
        cal_row = conn.execute(sql_cal, {"pk": worst_cal_pk}).first()
        if cal_row:
            calificacion_code = cal_row[0].strip()
            calificacion_desc = cal_row[1].strip()

    # 5. Saldo total de ahorros
    sql_ahorros = text(
        """
        SELECT COALESCE(SUM(f.montosaldocapitaltotal), 0) AS ahorros_total
        FROM dcuentaahorro a
        JOIN fcuentaahorro f ON f.pkcuentaahorro = a.pkcuentaahorro
            AND f.periododia = (
                SELECT MAX(f2.periododia) FROM fcuentaahorro f2
                WHERE f2.pkcuentaahorro = a.pkcuentaahorro
            )
        WHERE a.pkcliente = :pkcliente
        """
    )
    ahorros_total = float(conn.execute(sql_ahorros, {"pkcliente": pkcliente}).scalar() or 0.0)

    # 6. Calcular Score de Crédito (300 - 850)
    score = 600
    
    # Impacto de ingresos netos
    ingreso = float(cli["montoingresoneto"] or 0.0)
    if ingreso >= 5000:
        score += 120
    elif ingreso >= 3000:
        score += 60
    elif ingreso < 1500:
        score -= 80

    # Impacto de calificación SBS
    if calificacion_code == "0":
        score += 100
    elif calificacion_code == "1":
        score += 10
    elif calificacion_code == "2":
        score -= 100
    elif calificacion_code == "3":
        score -= 200
    elif calificacion_code == "4":
        score -= 300

    # Impacto de ratio deuda vs ahorros
    net_asset = ahorros_total - deuda_total
    if net_asset >= 15000:
        score += 80
    elif net_asset >= 5000:
        score += 40
    elif net_asset < -15000:
        score -= 100
    elif net_asset < -5000:
        score -= 50

    # Limitar score entre 300 y 850
    score = max(300, min(850, score))

    # Determinar si es Consumo (CO) o Microempresa (ME)
    sql_prod = text("SELECT TRIM(codtipocredito) FROM dproducto WHERE pkproducto = (SELECT pkproducto FROM dsolicitud WHERE pksolicitud = :pk)")
    codtipocredito = conn.execute(sql_prod, {"pk": pksolicitud}).scalar()
    if codtipocredito:
        codtipocredito = codtipocredito.strip()
    
    # '03' es Consumo
    is_consumo = codtipocredito == '03'
    required_score = 620 if is_consumo else 580
    
    aprobado_por_score = score >= required_score
    if aprobado_por_score:
        evaluacion_sugerida = "Aprobación Recomendada"
        color_evaluacion = "green"
    else:
        evaluacion_sugerida = "Riesgo Alto - Score Insuficiente"
        color_evaluacion = "red"

    return {
        "solicitud": sol,
        "cliente": cli,
        "finanzas": {
            "deuda_total": deuda_total,
            "ahorros_total": ahorros_total,
            "calificacion_sbs": calificacion_desc,
            "calificacion_code": calificacion_code,
        },
        "scoring": {
            "score": score,
            "score_requerido": required_score,
            "aprobado_por_score": aprobado_por_score,
            "evaluacion_sugerida": evaluacion_sugerida,
            "color_evaluacion": color_evaluacion,
        }
    }


def rechazar_solicitud(conn: Connection, pksolicitud: int) -> dict:
    """Cambia el estado de la solicitud a 'Rechazado'."""
    pkestado_rechazado = conn.execute(
        text("SELECT pksolicitudestado FROM dsolicitudestado WHERE codsolicitudestado='03'")
    ).scalar()
    if not pkestado_rechazado:
        raise ValueError("Estado 'Rechazado' no encontrado en dsolicitudestado")
        
    conn.execute(
        text("UPDATE dsolicitud SET pksolicitudestado = :est WHERE pksolicitud = :pk"),
        {"est": pkestado_rechazado, "pk": pksolicitud}
    )
    conn.commit()
    return {"mensaje": "Solicitud rechazada exitosamente", "pksolicitud": pksolicitud}

