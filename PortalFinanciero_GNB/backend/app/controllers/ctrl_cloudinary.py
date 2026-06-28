"""Controlador para la gestión de archivos con Cloudinary."""
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException

# Configuración estática (según requerimiento del prompt maestro)
cloudinary.config(
    cloud_name="dcg2urfni",
    api_key="283444648545275",
    api_secret="7yX9-BpKNhY-twJkhl_9PrC4MJY",
    secure=True
)

async def upload_documento_sustento(file: UploadFile) -> str:
    """Sube un archivo a Cloudinary y retorna su secure_url."""
    # Validar que sea PDF o imagen si es requerido, pero Cloudinary lo maneja bien.
    if not file.content_type.startswith("image/") and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Formato no soportado, use PDF o Imágenes.")
    
    try:
        # Cloudinary acepta streams (file.file)
        result = cloudinary.uploader.upload(
            file.file,
            folder="gnb_creditos_sustentos",
            resource_type="auto"
        )
        return result.get("secure_url")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error subiendo archivo a Cloudinary: {str(e)}")
