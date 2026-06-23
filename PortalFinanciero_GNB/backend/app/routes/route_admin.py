"""Router de administrador: estadísticas globales del banco y endpoints para Power BI.

Todos los endpoints exigen un token JWT con tipo == 'admin'.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.engine import Connection
from app.controllers import ctrl_admin
from app.core.cfg_database import get_db
from app.core.cfg_security import decodificar_token
from app.schemas.sch_creditos import SolicitudCreditoRequest
from app.schemas.sch_admin import ClienteCrearRequest
from app.repositories import repo_creditos
from app.core.cfg_security import decodificar_token
from app.controllers import ctrl_ahorros_eod

bearer_scheme = HTTPBearer(auto_error=True)


def get_admin(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """Valida que el token JWT tenga tipo == 'admin'."""
    payload = decodificar_token(creds.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if payload.get("tipo") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido a administradores",
        )
    return payload


router = APIRouter(
    prefix="/admin",
    tags=["administración"],
    dependencies=[Depends(get_admin)],
)


# ─── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/stats", summary="Estadísticas globales del banco")
def stats(conn: Connection = Depends(get_db)):
    """Consolida KPIs, distribución de productos, cartera SBS y mora."""
    return ctrl_admin.stats_globales(conn)

@router.get("/clientes", summary="Listado de todos los clientes")
def clientes(conn: Connection = Depends(get_db)):
    """Retorna todos los clientes con conteo de cuentas y créditos."""
    return ctrl_admin.listar_clientes(conn)


@router.get("/clientes/buscar", summary="Buscar clientes por query (nombre, documento o código)")
def buscar_clientes(q: str, conn: Connection = Depends(get_db)):
    """Busca clientes por coincidencia."""
    return ctrl_admin.buscar_clientes(conn, q)


@router.post("/clientes/crear", summary="Registrar nuevo cliente en ventanilla")
def crear_cliente(req: ClienteCrearRequest, conn: Connection = Depends(get_db)):
    """Registra un nuevo cliente con cuenta de ahorro y acceso a Homebanking."""
    try:
        return ctrl_admin.crear_cliente(conn, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/solicitudes", summary="Listar todas las solicitudes")
def get_solicitudes(conn: Connection = Depends(get_db)):
    """Lista todas las solicitudes."""
    return repo_creditos.listar_solicitudes(conn)


@router.post("/creditos/solicitar", summary="Registrar solicitud a nombre de un cliente")
def solicitar_credito(req: SolicitudCreditoRequest, conn: Connection = Depends(get_db)):
    """Registra una solicitud de crédito actuando como el cliente especificado."""
    if not req.pkcliente:
        raise HTTPException(status_code=400, detail="pkcliente es requerido para admin")
    res = repo_creditos.crear_solicitud(
        conn,
        pkcliente=req.pkcliente,
        montosolicitud=req.montosolicitud,
        plazo=req.plazo,
        codtipocredito=req.codtipocredito,
        codactividadeconomica=req.codactividadeconomica,
        montoingresoneto=req.montoingresoneto,
        con_seguro=req.con_seguro,
        fecha_desembolso=req.fecha_desembolso,
        dia_pago=req.dia_pago
    )
    return res


@router.post("/solicitudes/{id}/evaluar", summary="Evaluar solicitud y generar cronograma")
def evaluar_solicitud(id: int, conn: Connection = Depends(get_db)):
    """Pasa la solicitud a 'Aprobado' y retorna el cronograma temporal."""
    return repo_creditos.evaluar_solicitud(conn, id)


@router.post("/solicitudes/{id}/desembolsar", summary="Desembolsar solicitud aprobada")
def desembolsar_solicitud(id: int, conn: Connection = Depends(get_db)):
    """Crea la cuenta de crédito, el cronograma oficial y abona el saldo a la cuenta de ahorros."""
    return repo_creditos.desembolsar_solicitud(conn, id)


@router.post("/eod/ahorros", summary="Ejecutar Cron Job EOD de Cuentas de Ahorro")
def simular_eod_ahorros(conn: Connection = Depends(get_db)):
    """Simula el proceso Batch nocturno para cálculo y abono de intereses de ahorro."""
    return ctrl_ahorros_eod.procesar_eod_ahorros(conn)


# ─── Endpoints Power BI (formato plano JSON) ──────────────────────────────────

@router.get("/powerbi/clientes", summary="[Power BI] Clientes")
def pb_clientes(conn: Connection = Depends(get_db)):
    return ctrl_admin.powerbi_clientes(conn)


@router.get("/powerbi/ahorros", summary="[Power BI] Cuentas de Ahorro")
def pb_ahorros(conn: Connection = Depends(get_db)):
    return ctrl_admin.powerbi_ahorros(conn)


@router.get("/powerbi/creditos", summary="[Power BI] Cartera de Créditos")
def pb_creditos(conn: Connection = Depends(get_db)):
    return ctrl_admin.powerbi_creditos(conn)


@router.get("/powerbi/operaciones", summary="[Power BI] Transacciones")
def pb_operaciones(conn: Connection = Depends(get_db)):
    return ctrl_admin.powerbi_operaciones(conn)
