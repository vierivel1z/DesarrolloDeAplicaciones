from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal

class GestionCobranzaCreate(BaseModel):
    pkcuentacredito: int
    pktipogestion: int
    resultado: str
    compromisopago: Optional[date] = None
    montocomprometido: Optional[Decimal] = None

class TransicionMoraRequest(BaseModel):
    pkcuentacredito: int
    tipo_transicion: str  # 'judicial' o 'castigo'
