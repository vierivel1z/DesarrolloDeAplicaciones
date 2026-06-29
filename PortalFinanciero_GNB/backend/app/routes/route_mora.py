from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.engine import Connection

from app.controllers import ctrl_mora
from app.core.cfg_security import RequireRole, decodificar_token
from fastapi.security import HTTPBearer
from app.core.cfg_database import get_db
from app.schemas.sch_mora import GestionCobranzaCreate, TransicionMoraRequest

bearer_scheme = HTTPBearer(auto_error=True)

router = APIRouter(prefix="/mora", tags=["mora"], dependencies=[Depends(RequireRole(["MAKER", "CHECKER_1", "CHECKER_2", "COMITE", "SUPERADMIN"]))])

@router.post("/cron/eod")
def proceso_fin_de_dia(conn: Connection = Depends(get_db)):
    """Ejecuta el proceso Batch diario de actualización de mora."""
    try:
        return ctrl_mora.procesar_fin_de_dia_mora(conn)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/cartera")
def obtener_cartera_mora(conn: Connection = Depends(get_db)):
    """Consulta la cartera agrupada por bandas (Preventiva, Temprana, etc)."""
    return ctrl_mora.listar_cartera_mora(conn)

@router.post("/gestiones")
def registrar_gestion(
    body: GestionCobranzaCreate,
    conn: Connection = Depends(get_db),
    # Dummy, since codpersonal would come from token
):
    """Registra una gestión de cobranza (llamada, compromiso de pago, etc)."""
    return ctrl_mora.registrar_gestion(conn, body, "admin")

@router.post("/transicion")
def transicion_mora(
    body: TransicionMoraRequest,
    conn: Connection = Depends(get_db),
    role: str = Depends(RequireRole(["CHECKER_2", "SUPERADMIN"]))
):
    """Deriva a judicial o castigo, validando rol y umbrales de tiempo."""
        
    try:
        return ctrl_mora.aplicar_transicion(conn, body.pksolicitud, body.tipo_transicion)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
