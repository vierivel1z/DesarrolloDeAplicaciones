"""Escrituras SQL para solicitar un crédito (registro en dsolicitud).

Alcance: solo Microempresa (ME) y Consumo (CO).
"""
from decimal import Decimal
import math
import random
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

from sqlalchemy import text
from sqlalchemy.engine import Connection

from app.repositories.repo_cuentas import PERIODO_CARTERA

# codtipocredito del portal -> codtipocredito en dproducto
MAPA_TIPO_CREDITO = {
    "ME": "01", 
    "CO": "03",
    "FACIL": "03",
    "LIBRE": "03",
    "ESTANDAR": "03",
    "CONVENIO": "03",
    "YAPE": "03"
}  # ME=Microempresa, CO=Consumo

def consultar_semaforo_sbs(conn: Connection, dni: str) -> int:
    row = conn.execute(
        text("SELECT semaforo FROM sbs_central_riesgo WHERE dni = :dni"),
        {"dni": dni}
    ).scalar()
    return int(row) if row is not None else 0

def obtener_info_cliente_elegibilidad(conn: Connection, pkcliente: int) -> dict:
    row = conn.execute(
        text("""
            SELECT fechanacimiento, fecha_ingreso_laboral, tipo_trabajador, numerodocumentoidentidad
            FROM dcliente
            WHERE pkcliente = :pk
        """),
        {"pk": pkcliente}
    ).mappings().first()
    return dict(row) if row else {}

def registrar_firma_checker(conn: Connection, pksolicitud: int, nivel: int, usuario: str) -> None:
    if nivel == 1:
        conn.execute(
            text("UPDATE dsolicitud SET firma_checker1_fecha = NOW(), firma_checker1_user = :u WHERE pksolicitud = :pk"),
            {"u": usuario, "pk": pksolicitud}
        )
    elif nivel == 2:
        conn.execute(
            text("UPDATE dsolicitud SET firma_checker2_fecha = NOW(), firma_checker2_user = :u WHERE pksolicitud = :pk"),
            {"u": usuario, "pk": pksolicitud}
        )
    conn.commit()

def actualizar_estado_solicitud(conn: Connection, pksolicitud: int, cod_estado: str) -> None:
    pkest = _pk_estado_solicitud(conn, cod_estado)
    if pkest:
        conn.execute(text("UPDATE dsolicitud SET pksolicitudestado = :est WHERE pksolicitud = :pk"), {"est": pkest, "pk": pksolicitud})
        conn.commit()

def listar_solicitudes(conn: Connection) -> list[dict]:
    """Lista todas las solicitudes de crédito."""
    sql = text(
        """
        SELECT s.pksolicitud as id, s.codsolicitud, s.pkcliente, c.nomcliente, c.numerodocumentoidentidad,
               s.montosolicitudcredito as monto, s.plazosolicitudcredito as plazo, s.fechasolicitudcredito as fecha,
               e.dessolicitudestado as estado, s.pksolicitudestado, e.codsolicitudestado as codestado,
               s.pknivelaprobacion, s.desmotivosolicitud, s.archivo_sustento_path,
               s.score_pd, s.dti_ratio, s.tasainterescompensatoria as tea, s.otp_codigo
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


def _pk_nivel_aprobacion(conn: Connection, monto: Decimal) -> int | None:
    return conn.execute(
        text(
            """
            SELECT pknivelaprobacion FROM dnivelaprobacion
            WHERE :monto >= montominimo AND :monto <= montomaximo
            ORDER BY pknivelaprobacion ASC LIMIT 1
            """
        ),
        {"monto": monto},
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
    archivo_sustento_url: str,
    con_seguro: bool = True,
    fecha_desembolso: str | None = None,
    dia_pago: int | None = None,
    pknivelaprobacion: int | None = None,
    desmotivosolicitud: str | None = None,
    tea_calculada: Decimal | None = None,
) -> dict:
    tea = tea_calculada if tea_calculada is not None else (Decimal('0.4092') if con_seguro else Decimal('0.4392'))
    cod_tipo_producto = MAPA_TIPO_CREDITO[codtipocredito]
    pkproducto = _pk_producto_por_tipo(conn, cod_tipo_producto)
    if pkproducto is None:
        raise ValueError(f"No hay producto activo para el tipo de crédito '{codtipocredito}'")

    pkestado = _pk_estado_solicitud(conn, "01") # Estado inicial '01'
    if pkestado is None:
        raise ValueError("No existe el estado inicial '01' en dsolicitudestado")

    pkactividad = _pk_actividad(conn, codactividadeconomica)
    if pkactividad is None:
        raise ValueError(f"Actividad económica '{codactividadeconomica}' no encontrada")

    pkmoneda = conn.execute(
        text("SELECT pkmoneda FROM dmoneda WHERE TRIM(codmoneda) = 'SO'")
    ).scalar()
    pkagencia, pkasesor = _agencia_asesor_del_cliente(conn, pkcliente)

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
                pknivelaprobacion, desmotivosolicitud, archivo_sustento_path,
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
                :pknivelaprobacion, :desmotivosolicitud, :archivo,
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
            "pknivelaprobacion": pknivelaprobacion,
            "desmotivosolicitud": desmotivosolicitud,
            "archivo": archivo_sustento_url,
        },
    ).mappings().first()
    conn.commit()
    return {"pksolicitud": row["pksolicitud"], "codsolicitud": row["codsolicitud"].strip()}

def actualizar_evaluacion_solicitud(conn: Connection, pksolicitud: int, score_pd: Decimal, dti_ratio: Decimal, comentarios: str) -> None:
    # Estado "EVALUADA_PENDIENTE_FIRMA"
    pkestado = _pk_estado_solicitud(conn, 'EV')
    conn.execute(
        text("""
            UPDATE dsolicitud SET 
                score_pd = :score,
                dti_ratio = :dti,
                comentarios_analista = :comentarios,
                pksolicitudestado = :pkestado
            WHERE pksolicitud = :pk
        """),
        {"score": score_pd, "dti": dti_ratio, "comentarios": comentarios, "pkestado": pkestado, "pk": pksolicitud}
    )
    conn.commit()

def asignar_tea_y_otp(conn: Connection, pksolicitud: int, tea: Decimal) -> str:
    otp = str(random.randint(100000, 999999))
    pkestado = _pk_estado_solicitud(conn, 'EF')
    conn.execute(
        text("""
            UPDATE dsolicitud SET 
                tasainterescompensatoria = :tea,
                otp_codigo = :otp,
                pksolicitudestado = :pkestado
            WHERE pksolicitud = :pk
        """),
        {"tea": tea, "otp": otp, "pkestado": pkestado, "pk": pksolicitud}
    )
    conn.commit()
    return otp

def validar_otp_cliente(conn: Connection, pksolicitud: int, otp_ingresado: str) -> bool:
    sol = conn.execute(
        text("SELECT otp_codigo FROM dsolicitud WHERE pksolicitud = :pk"),
        {"pk": pksolicitud}
    ).mappings().first()

    if sol and sol["otp_codigo"] == otp_ingresado:
        pkestado = _pk_estado_solicitud(conn, 'AL')
        conn.execute(
            text("UPDATE dsolicitud SET pksolicitudestado = :pkestado WHERE pksolicitud = :pk"),
            {"pkestado": pkestado, "pk": pksolicitud}
        )
        conn.commit()
        return True
    return False

def evaluar_solicitud(conn: Connection, pksolicitud: int) -> dict:
    """Genera cronograma preliminar matematico."""
    sol = conn.execute(
        text("SELECT * FROM dsolicitud WHERE pksolicitud = :pk"),
        {"pk": pksolicitud}
    ).mappings().first()
    if not sol:
        raise ValueError("Solicitud no encontrada")

    tea = sol["tasainterescompensatoria"] or Decimal('0.4392')
    monto = sol["montosolicitudcredito"]
    plazo = sol["plazosolicitudcredito"]
    dia_pago = sol["diafechafija"] or 1
    fecha_desembolso = sol["fechaaprobacioncredito"] or date.today()

    tem = Decimal(math.pow(1 + float(tea)/100.0, 30.0/360.0) - 1)
    if tem == 0:
        cuota_pura = monto / plazo
    else:
        cuota_pura = monto * (tem * Decimal(math.pow(1 + float(tem), plazo))) / (Decimal(math.pow(1 + float(tem), plazo)) - 1)
    
    cronograma = []
    saldo = monto
    fecha_pago = fecha_desembolso
    
    tasa_sd = Decimal("0.000738")
    tasa_itf = Decimal("0.00005")

    for n in range(1, plazo + 1):
        fecha_pago = fecha_pago + relativedelta(months=1)
        try:
            fecha_pago = fecha_pago.replace(day=dia_pago)
        except ValueError:
            fecha_pago = fecha_pago + relativedelta(day=31)

        I = round(saldo * tem, 2)
        if n == plazo:
            A = saldo
            cuota_pura = A + I
        else:
            A = round(cuota_pura - I, 2)
            if saldo - A < 0:
                A = saldo
                cuota_pura = A + I

        # SD sobre el capital remanente MP
        SD = round(saldo * tasa_sd, 2)
        ITF = round((cuota_pura + SD) * tasa_itf, 2)
        C = round(cuota_pura + SD + ITF, 2)
        
        # Fórmula SBS: A = C - SD - I - ITF
        A = C - SD - I - ITF
        saldo -= A
        
        cronograma.append({
            "nrocuota": n,
            "fecha_vencimiento": fecha_pago.strftime("%Y-%m-%d"),
            "monto_cuota": C,
            "capital": A,
            "interes": I,
            "saldo_capital": max(Decimal('0.0'), saldo)
        })
    return {"cronograma": cronograma, "monto_total": sum(c["monto_cuota"] for c in cronograma)}

def desembolsar_solicitud(conn: Connection, pksolicitud: int) -> dict:
    """Crea la cuenta transaccional, inyecta capital, y registra foperaciones."""
    sol = conn.execute(
        text("SELECT * FROM dsolicitud WHERE pksolicitud = :pk"),
        {"pk": pksolicitud}
    ).mappings().first()
    if not sol:
        raise ValueError("Solicitud no encontrada")

    # a) Cuenta Transaccional
    pktipotc = conn.execute(text("SELECT pktipocuentaahorro FROM dtipocuentaahorro WHERE codtipocuentaahorro='TC'")).scalar()
    
    # Crear dcuentaahorro tecnica
    import random
    nro_cuenta_11_dig = f"530{random.randint(10000000, 99999999)}"
    cci_20_dig = f"0530010{nro_cuenta_11_dig}00"
    
    cod_cta_tec = f"TC{pksolicitud}"
    row_cta = conn.execute(
        text("""
        INSERT INTO dcuentaahorro (codcuentaahorro, pkcliente, nro_cuenta, cci, tipo_cuenta, fecultactualizacion) 
        VALUES (:cod, :cli, :nro, :cci, 'TRANSACCIONAL_CREDITO', NOW()) 
        RETURNING pkcuentaahorro
        """),
        {"cod": cod_cta_tec, "cli": sol["pkcliente"], "nro": nro_cuenta_11_dig, "cci": cci_20_dig}
    ).first()
    pkcuenta_tec = row_cta[0]

    pkproducto_ah = conn.execute(text("SELECT MIN(pkproductoahorro) FROM dproductoahorro")).scalar() or 1

    # Insertar fcuentaahorro para la transaccional
    conn.execute(
        text('''
        INSERT INTO fcuentaahorro (
            periododia, pkcuentaahorro, pkproductoahorro, pktipocuentaahorro,
            montosaldocapitaltotal, montosaldodisponible_ac, pkcliente, pkagencia,
            pkmoneda, pkestadocuenta, fechaaperturacuenta
        ) VALUES (
            20260202, :pkah, :pkprod, :pktipo,
            0.0, 0.0, :cli, 1,
            :mon, 1, NOW()
        )
        '''),
        {"pkah": pkcuenta_tec, "pkprod": pkproducto_ah, "pktipo": pktipotc, "cli": sol["pkcliente"], "mon": sol["pkmoneda"]}
    )

    # Crear cuenta credito
    row_credito = conn.execute(
        text("INSERT INTO dcuentacredito (codcuentacredito, codlineacredito, pkcliente) VALUES ('CRE' || :pk, 'CR', :cli) RETURNING pkcuentacredito"),
        {"pk": pksolicitud, "cli": sol["pkcliente"]}
    ).first()
    pkcuentacredito = row_credito[0]

    eval_result = evaluar_solicitud(conn, pksolicitud)
    cronograma = eval_result["cronograma"]

    pkmoneda = sol["pkmoneda"]
    pkproducto = sol["pkproducto"]
    pkcliente = sol["pkcliente"]
    pkagencia = sol["pkagencia"]
    pkasesor = sol["pkasesor"]

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

    # b) Abono a la cuenta de ahorros principal. 
    # El abono será al pkcuentaahorro con saldo activo del cliente (no la transaccional vacía)
    cuenta_ahorro = conn.execute(
        text("SELECT pkcuentaahorro FROM dcuentaahorro WHERE pkcliente = :cli AND codcuentaahorro NOT LIKE 'TC%' ORDER BY pkcuentaahorro LIMIT 1"),
        {"cli": pkcliente}
    ).scalar()
    
    if cuenta_ahorro:
        conn.execute(
            text("UPDATE fcuentaahorro SET montosaldocapitaltotal = montosaldocapitaltotal + :monto, montosaldodisponible = montosaldodisponible + :monto WHERE pkcuentaahorro = :pkah"),
            {"monto": sol["montosolicitudcredito"], "pkah": cuenta_ahorro}
        )
        
        # c) foperaciones
        glosa = f"DESEMBOLSO PRÉSTAMO PERSONAL GNB NRO-{pksolicitud}"
        conn.execute(
            text('''
            INSERT INTO foperaciones (
                codtipkar, pkcuentacredito, pkcuentaahorro, codkardex, pkconceptooperacion,
                fechahoraoperacion, periododia, pktipooperacion, pkmoneda,
                pkagenciaorigen, codtipoegresoingreso, montooperacion, glosa_operacion
            ) VALUES (
                'DE', :pkcc, :pkah, 'DESEMBOLSO', 1,
                now(), 20260202, 1, :pkmon,
                :age, 'I', :monto, :glosa
            )
            '''),
            {
                "pkcc": pkcuentacredito, "pkah": cuenta_ahorro, "pkmon": pkmoneda, "age": pkagencia,
                "monto": sol["montosolicitudcredito"], "glosa": glosa
            }
        )

    # d) Estado final a 03
    pkestado_desembolsado = conn.execute(text("SELECT pksolicitudestado FROM dsolicitudestado WHERE codsolicitudestado='03'")).scalar()
    if pkestado_desembolsado:
        conn.execute(
            text("UPDATE dsolicitud SET pksolicitudestado = :est, cuenta_transaccional_asociada = :cta WHERE pksolicitud = :pk"), 
            {"est": pkestado_desembolsado, "cta": cod_cta_tec, "pk": pksolicitud}
        )

    conn.commit()
    return {"mensaje": "Crédito desembolsado exitosamente", "pkcuentacredito": pkcuentacredito, "cuenta_transaccional": cod_cta_tec}


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
               p.destipocredito as producto_tipo, p.dessubproducto as producto_subtipo,
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

