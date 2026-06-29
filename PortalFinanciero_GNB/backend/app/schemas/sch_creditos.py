"""Schemas pydantic para solicitud de crédito y flujos GNB."""
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field, constr


class SolicitudCreditoIn(BaseModel):
    """Schema para solicitud inicial del cliente desde Homebanking."""
    numero_documento: str = Field(..., description="DNI del cliente")
    moneda: Literal["PEN", "USD"] = Field(..., description="PEN o USD")
    monto: Decimal = Field(..., ge=500, le=80000, description="Monto solicitado")
    plazo: int = Field(..., ge=3, le=60, description="Plazo en meses")
    archivo_sustento_url: str = Field(..., description="URL segura de Cloudinary")
    codtipocredito: str = Field("CO", description="Tipo de crédito")
    codactividadeconomica: str = Field("0111", description="Código actividad económica")
    ingreso_neto_mensual: Decimal = Field(..., ge=0, description="Ingreso declarado por el cliente")

class EvaluarSolicitudIn(BaseModel):
    """Schema para el MAKER."""
    score_pd: Decimal = Field(..., ge=0, le=100, description="Probabilidad de Default (0-100)")
    ingreso_neto_mensual: Decimal = Field(..., gt=0, description="Ingreso verificado por el analista")
    comentarios_analista: str = Field(..., min_length=1, description="Comentarios de evaluación")

class AprobarSolicitudIn(BaseModel):
    """Schema para el CHECKER 1."""
    tea_aprobada: Decimal = Field(..., gt=0, description="TEA asignada, debe estar en límites")

class ValidarOtpIn(BaseModel):
    """Schema para firma del cliente."""
    codigo_otp: constr(min_length=6, max_length=6) = Field(..., description="Código OTP de 6 dígitos") # type: ignore

class ConfigurarParametrosIn(BaseModel):
    """Schema para el SUPERADMIN."""
    monto_min_pen: Decimal = Field(..., gt=0)
    monto_max_pen: Decimal = Field(..., gt=0)
    monto_min_usd: Decimal = Field(..., gt=0)
    monto_max_usd: Decimal = Field(..., gt=0)
    tea_min: Decimal = Field(..., gt=0)
    tea_max: Decimal = Field(..., gt=0)

class SolicitudCreditoResponse(BaseModel):
    mensaje: str
    pksolicitud: int
    codsolicitud: str
    estado: str
    monto: Decimal
    plazo: int

class SimularCreditoRequest(BaseModel):
    monto: Decimal = Field(..., gt=0)
    tea: Decimal = Field(..., gt=0)
    plazo: int = Field(..., gt=0, description="Plazo en meses")

class SimularCreditoResponse(BaseModel):
    monto_financiar: Decimal
    cuota_pura: Decimal
    cuota_total: Decimal
