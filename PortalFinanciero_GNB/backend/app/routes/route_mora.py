from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.engine import Connection

from app.controllers import ctrl_mora
from app.core.cfg_auth import get_empleado
from app.core.cfg_database import get_db
from app.schemas.sch_mora import GestionCobranzaCreate, TransicionMoraRequest

router = APIRouter(prefix="/mora", tags=["mora"], dependencies=[Depends(get_empleado)])

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
    empleado: dict = Depends(get_empleado)
):
    """Registra una gestión de cobranza (llamada, compromiso de pago, etc)."""
    return ctrl_mora.registrar_gestion(conn, body, empleado["codpersonal"])

@router.post("/transicion")
def transicion_mora(
    body: TransicionMoraRequest,
    conn: Connection = Depends(get_db),
    empleado: dict = Depends(get_empleado)
):
    """Deriva a judicial o castigo, validando rol y umbrales de tiempo."""
    # Validación simple de rol (F04 Riesgos, F05 Comité, F02 Admin)
    cargo = empleado.get("codcargo")
    if cargo not in ["F02", "F04", "F05"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para derivar a judicial o castigar deudas.")
        
    try:
        return ctrl_mora.aplicar_transicion(conn, body.pkcuentacredito, body.tipo_transicion)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
