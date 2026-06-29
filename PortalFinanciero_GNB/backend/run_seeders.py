import os
import sys
from sqlalchemy import text
from app.core.cfg_database import engine

def run_sql_files():
    sql_dir = r"c:\Users\Vieri\Documents\GitHub\DesarrolloDeAplicaciones\PortalFinanciero_GNB\Sql"
    
    # Lista de archivos a ejecutar secuencialmente para re-inicializar el esquema y poblar datos
    files = [
        "07_DDL_DML_mejoras_proyecto.sql",
        "09_DDL_simulador_gnb.sql",
        "09_DML_productos_gnb.sql",
        "10_DDL_DML_creditos_gnb.sql",
        "11_onboarding_gnb_cuentas.sql",
        "12_DDL_DML_sbs_y_aprobaciones.sql",
        "13_DDL_DML_usuarios_admin.sql",
        "14_DDL_mora_gestiones_kpis.sql",
        "16_DML_seeder_definitivo.sql"
    ]
    
    print("Iniciando ejecución de archivos SQL...")
    
    with engine.begin() as conn:
        for file_name in files:
            path = os.path.join(sql_dir, file_name)
            if not os.path.exists(path):
                print(f"Error: No existe el archivo {path}")
                continue
                
            print(f"Ejecutando: {file_name}")
            with open(path, "r", encoding="utf-8") as f:
                sql_content = f.read()
            
            # Ejecutamos el archivo SQL
            try:
                # Reemplazamos algunas cosas si fuera necesario, o ejecutamos directamente
                # Dividir por bloques si contiene comandos de transacciones explícitas que puedan interferir con begin()
                # Pero la mayoría se pueden ejecutar directamente.
                conn.execute(text(sql_content))
                print(f"Completado exitosamente: {file_name}")
            except Exception as e:
                print(f"Error ejecutando {file_name}: {e}")
                
    print("Proceso de seeders finalizado.")

if __name__ == "__main__":
    run_sql_files()
