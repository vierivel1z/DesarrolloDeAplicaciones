"""Router de créditos: Flujo completo para clientes."""
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.engine import Connection

from app.controllers import ctrl_creditos, ctrl_cloudinary
from app.core.cfg_auth import get_cliente
from app.core.cfg_database import get_db
from app.schemas.sch_creditos import (
    SolicitudCreditoIn, 
    SolicitudCreditoResponse,
    ValidarOtpIn
)

router = APIRouter(prefix="/creditos", tags=["creditos"])

@router.post("/upload-documento")
async def upload_documento(file: UploadFile = File(...)):
    """Sube el documento a Cloudinary de manera libre o protegida."""
    url = await ctrl_cloudinary.upload_documento_sustento(file)
    return {"secure_url": url}


@router.post("/solicitar", response_model=SolicitudCreditoResponse)
def solicitar(
    body: SolicitudCreditoIn,
    conn: Connection = Depends(get_db),
    cliente: dict = Depends(get_cliente), # Exige JWT del cliente
):
    return ctrl_creditos.solicitar(
        conn,
        pkcliente=cliente["pkcliente"],
        montosolicitud=body.monto,
        plazo=body.plazo,
        codtipocredito=body.codtipocredito,
        codactividadeconomica=body.codactividadeconomica,
        montoingresoneto=body.ingreso_neto_mensual,
        archivo_sustento_url=body.archivo_sustento_url
    )

@router.post("/{id}/firmar-contrato")
def firmar_contrato(
    id: int,
    body: ValidarOtpIn,
    conn: Connection = Depends(get_db),
    cliente: dict = Depends(get_cliente), # Exige JWT del cliente
):
    return ctrl_creditos.validar_otp(conn, id, body.codigo_otp)
