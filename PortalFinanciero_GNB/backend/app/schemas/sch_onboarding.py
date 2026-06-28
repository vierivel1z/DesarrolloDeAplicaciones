from pydantic import BaseModel, Field

class OnboardingPaso1In(BaseModel):
    codigo_invitacion: str = Field(..., description="UUID de invitación recibido por correo")

class OnboardingPaso2In(BaseModel):
    pkcliente: int = Field(..., description="ID del cliente a activar")
    pin_sms: str = Field(..., description="PIN de 4 dígitos enviado por SMS")

class OnboardingFinalIn(BaseModel):
    pkcliente: int = Field(..., description="ID del cliente a activar")
    username: str = Field(..., min_length=5, description="Nombre de usuario definitivo")
    password: str = Field(..., min_length=8, description="Contraseña segura")
    sello_seguridad_id: int = Field(..., description="ID del sello visual seleccionado del catálogo")
