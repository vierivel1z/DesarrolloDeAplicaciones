from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal

class GestionCobranzaCreate(BaseModel):
    id_solicitud: int
    canal_contacto: str
    codigo_respuesta: str
    comentarios: Optional[str] = None
    fecha_compromiso_pago: Optional[date] = None
    monto_comprometido: Optional[Decimal] = None

class TransicionMoraRequest(BaseModel):
    pksolicitud: int
    tipo_transicion: str  # 'judicial' o 'castigo'
