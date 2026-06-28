"""Repositorio para la gestión de parámetros globales del crédito."""
from sqlalchemy import text
from sqlalchemy.engine import Connection

def obtener_parametros(conn: Connection) -> dict:
    """Obtiene los parámetros actuales de crédito."""
    row = conn.execute(
        text("SELECT * FROM dparametros_credito ORDER BY pkparametro DESC LIMIT 1")
    ).mappings().first()
    
    if not row:
        # Fallback values si no hay fila
        return {
            "monto_min_pen": 1500.0,
            "monto_max_pen": 80000.0,
            "monto_min_usd": 500.0,
            "monto_max_usd": 25000.0,
            "tea_min": 13.0,
            "tea_max": 36.0
        }
    return dict(row)

def actualizar_parametros(
    conn: Connection,
    monto_min_pen: float, monto_max_pen: float,
    monto_min_usd: float, monto_max_usd: float,
    tea_min: float, tea_max: float
) -> dict:
    """Actualiza (o inserta nueva versión) de los parámetros de crédito."""
    # Insertar nueva fila para mantener historial o actualizar la existente
    # Aquí actualizamos la existente para simplificar o insertamos si no hay
    existe = conn.execute(text("SELECT 1 FROM dparametros_credito")).scalar()
    
    if existe:
        conn.execute(
            text("""
                UPDATE dparametros_credito 
                SET monto_min_pen = :mminp, monto_max_pen = :mmaxp,
                    monto_min_usd = :mminu, monto_max_usd = :mmaxu,
                    tea_min = :tmin, tea_max = :tmax,
                    fecultactualizacion = now()
            """),
            {
                "mminp": monto_min_pen, "mmaxp": monto_max_pen,
                "mminu": monto_min_usd, "mmaxu": monto_max_usd,
                "tmin": tea_min, "tmax": tea_max
            }
        )
    else:
        conn.execute(
            text("""
                INSERT INTO dparametros_credito (
                    monto_min_pen, monto_max_pen, monto_min_usd, monto_max_usd, tea_min, tea_max
                ) VALUES (
                    :mminp, :mmaxp, :mminu, :mmaxu, :tmin, :tmax
                )
            """),
            {
                "mminp": monto_min_pen, "mmaxp": monto_max_pen,
                "mminu": monto_min_usd, "mmaxu": monto_max_usd,
                "tmin": tea_min, "tmax": tea_max
            }
        )
    conn.commit()
    return obtener_parametros(conn)
