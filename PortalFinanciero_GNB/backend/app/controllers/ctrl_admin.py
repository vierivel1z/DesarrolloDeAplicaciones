"""Controlador de administración: orquesta llamadas al repositorio."""
from sqlalchemy.engine import Connection
from sqlalchemy import text
from app.repositories import repo_admin


def stats_globales(conn: Connection) -> dict:
    return repo_admin.stats_globales(conn)


def obtener_kpis_mora(conn: Connection) -> dict:
    sql = text('''
        WITH Cartera AS (
            SELECT 
                SUM(montosaldocapital) AS cartera_bruta,
                SUM(CASE WHEN diasatrasocredito > 30 OR flagjudicial = 'S' THEN montosaldocapital ELSE 0 END) AS cartera_atrasada,
                SUM(CASE WHEN diasatrasocredito > 8 OR flagjudicial = 'S' OR flagcastigado = 'S' THEN montosaldocapital ELSE 0 END) AS cartera_pesada,
                SUM(CASE WHEN diasatrasocredito > 30 OR flagjudicial = 'S' THEN montosaldocapital ELSE 0 END) AS cartera_alto_riesgo
            FROM fagcuentacredito
        )
        SELECT 
            cartera_bruta,
            cartera_atrasada,
            cartera_pesada,
            cartera_alto_riesgo
        FROM Cartera
    ''')
    res = conn.execute(sql).mappings().first()
    if not res or not res['cartera_bruta'] or res['cartera_bruta'] == 0:
        return {"Ratio_Mora_Global": 0, "Ratio_Cartera_Pesada": 0, "Ratio_Cobertura_Provisiones": 0}
        
    provisiones = conn.execute(text("SELECT monto_provisiones_totales FROM dprovisiones_banco LIMIT 1")).scalar() or 0
    
    c_bruta = float(res['cartera_bruta'])
    c_atrasada = float(res['cartera_atrasada'] or 0)
    c_pesada = float(res['cartera_pesada'] or 0)
    c_alto_riesgo = float(res['cartera_alto_riesgo'] or 0)
    provisiones = float(provisiones)
    
    ratio_mora = (c_atrasada / c_bruta) * 100
    ratio_cp = (c_pesada / c_bruta) * 100
    ratio_cob = (provisiones / c_alto_riesgo * 100) if c_alto_riesgo > 0 else 100.00
    
    return {
        "Ratio_Mora_Global": round(ratio_mora, 2),
        "Ratio_Cartera_Pesada": round(ratio_cp, 2),
        "Ratio_Cobertura_Provisiones": round(ratio_cob, 2),
        "Metricas": {
            "Cartera_Bruta": round(c_bruta, 2),
            "Cartera_Atrasada": round(c_atrasada, 2),
            "Cartera_Pesada": round(c_pesada, 2),
            "Cartera_Alto_Riesgo": round(c_alto_riesgo, 2),
            "Provisiones_Totales": round(provisiones, 2)
        }
    }


def listar_clientes(conn: Connection) -> list:
    return repo_admin.listar_clientes(conn)


def powerbi_clientes(conn: Connection) -> list:
    return repo_admin.powerbi_clientes(conn)


def powerbi_ahorros(conn: Connection) -> list:
    return repo_admin.powerbi_ahorros(conn)
def powerbi_creditos(conn: Connection) -> list:
    return repo_admin.powerbi_creditos(conn)


def powerbi_operaciones(conn: Connection) -> list:
    return repo_admin.powerbi_operaciones(conn)


def buscar_clientes(conn: Connection, q: str) -> list:
    return repo_admin.buscar_clientes_por_query(conn, q)


def crear_cliente(conn: Connection, req) -> dict:
    return repo_admin.crear_cliente_ventanilla(conn, req)
