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


from fastapi import Header
from app.schemas.sch_creditos import (
    EvaluarSolicitudIn, 
    AprobarSolicitudIn, 
    ConfigurarParametrosIn
)
from app.controllers import ctrl_creditos
from app.repositories import repo_parametros

def get_role(x_user_role: str = Header(None)) -> str:
    # Simula la lectura del rol. En prod vendría del payload JWT.
    if not x_user_role:
        raise HTTPException(status_code=403, detail="Header X-User-Role requerido")
    return x_user_role.upper()

def require_maker(role: str = Depends(get_role)):
    if role != "MAKER": raise HTTPException(status_code=403, detail="Requiere rol MAKER")

def require_checker1(role: str = Depends(get_role)):
    if role != "CHECKER_1": raise HTTPException(status_code=403, detail="Requiere rol CHECKER_1")

def require_checker2(role: str = Depends(get_role)):
    if role != "CHECKER_2": raise HTTPException(status_code=403, detail="Requiere rol CHECKER_2")

def require_superadmin(role: str = Depends(get_role)):
    if role != "SUPERADMIN": raise HTTPException(status_code=403, detail="Requiere rol SUPERADMIN")

@router.get("/solicitudes", summary="Listar todas las solicitudes")
def get_solicitudes(conn: Connection = Depends(get_db)):
    """Lista todas las solicitudes."""
    return repo_creditos.listar_solicitudes(conn)

@router.post("/creditos/{id}/evaluar", summary="Evaluar solicitud (MAKER)", dependencies=[Depends(require_maker)])
def evaluar_solicitud(id: int, body: EvaluarSolicitudIn, conn: Connection = Depends(get_db)):
    return ctrl_creditos.evaluar_credito(conn, id, body.score_pd, body.ingreso_neto_mensual, body.comentarios_analista)

@router.post("/creditos/{id}/enviar-otp", summary="Aprobar TEA y enviar OTP (CHECKER 1)", dependencies=[Depends(require_checker1)])
def enviar_otp(id: int, body: AprobarSolicitudIn, conn: Connection = Depends(get_db)):
    return ctrl_creditos.asignar_tea_y_otp(conn, id, body.tea_aprobada)

@router.post("/creditos/{id}/desembolsar", summary="Desembolsar (CHECKER 2)", dependencies=[Depends(require_checker2)])
def desembolsar_solicitud(id: int, conn: Connection = Depends(get_db)):
    return ctrl_creditos.desembolsar(conn, id)

@router.put("/creditos/parametros", summary="Configurar Parámetros (SUPERADMIN)", dependencies=[Depends(require_superadmin)])
def configurar_parametros(body: ConfigurarParametrosIn, conn: Connection = Depends(get_db)):
    return repo_parametros.actualizar_parametros(
        conn,
        body.monto_min_pen, body.monto_max_pen,
        body.monto_min_usd, body.monto_max_usd,
        body.tea_min, body.tea_max
    )


from app.controllers import ctrl_eod_batch

@router.post("/eod/ahorros", summary="Ejecutar Cron Job EOD Tradicional (Legacy)")
def simular_eod_ahorros(conn: Connection = Depends(get_db)):
    """Simula el proceso Batch nocturno para cálculo y abono de intereses de ahorro tradicionales."""
    return ctrl_ahorros_eod.procesar_eod_ahorros(conn)

@router.post("/eod/capitalizar", summary="Ejecutar Batch EOD GNB (Ahorro Rolando)")
def simular_eod_capitalizar_gnb(conn: Connection = Depends(get_db)):
    """Abono diario de intereses exclusivo para cuentas AHORRO_ROLANDO (Banco GNB)."""
    return ctrl_eod_batch.capitalizar_ahorro_rolando(conn)


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
