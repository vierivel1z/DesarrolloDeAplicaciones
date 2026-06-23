import os
from sqlalchemy import text
from app.core.cfg_database import engine

def actualizar_productos():
    sql_path = r"c:\Users\Vieri\Documents\GitHub\DesarrolloDeAplicaciones\PortalFinanciero_GNB\Sql\09_DML_productos_gnb.sql"
    with open(sql_path, "r", encoding="utf-8") as f:
        sql_commands = f.read()
    
    with engine.begin() as conn:
        conn.execute(text(sql_commands))
        print("Productos de Banco GNB actualizados correctamente en DPRODUCTOAHORRO.")

if __name__ == "__main__":
    actualizar_productos()
