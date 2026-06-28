from fastapi import APIRouter, Depends
from sqlalchemy.engine import Connection
from app.core.cfg_database import get_db
from app.schemas.sch_onboarding import OnboardingPaso1In, OnboardingPaso2In, OnboardingFinalIn
from app.controllers import ctrl_onboarding

router = APIRouter(prefix="/onboarding", tags=["Onboarding GNB"])

@router.post("/validar-invitacion")
def validar_invitacion(req: OnboardingPaso1In, conn: Connection = Depends(get_db)):
    return ctrl_onboarding.validar_invitacion(conn, req.codigo_invitacion)

@router.post("/validar-sms")
def validar_sms(req: OnboardingPaso2In, conn: Connection = Depends(get_db)):
    return ctrl_onboarding.validar_sms(conn, req.pkcliente, req.pin_sms)

@router.post("/completar-registro")
def completar_registro(req: OnboardingFinalIn, conn: Connection = Depends(get_db)):
    return ctrl_onboarding.completar_registro(conn, req.pkcliente, req.username, req.password, req.sello_seguridad_id)
