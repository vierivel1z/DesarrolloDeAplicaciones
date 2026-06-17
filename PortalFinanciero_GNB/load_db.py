import os
import sys
import time

# Get absolute paths relative to the script location
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(script_dir, 'backend')
venv_site_packages = os.path.join(backend_dir, '.venv', 'Lib', 'site-packages')

# Dynamically add the virtual environment's site-packages to sys.path
if os.path.exists(venv_site_packages):
    sys.path.insert(0, venv_site_packages)

# Add backend directory to sys.path
sys.path.append(backend_dir)

# Now import dotenv and load the env file
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

from sqlalchemy import text
from app.core.cfg_database import engine

SQL_FILES = [
    'Sql/00_DDL_drop_tables_banco_andino.sql',
    'Sql/01_DDL_create_tables_banco_andino.sql',
    'Sql/02_DML_catalogos_banco_andino.sql',
    'Sql/03_DML_clientes_personal_banco_andino.sql',
    'Sql/04_DML_creditos_2025_banco_andino.sql',
    'Sql/05_DML_ahorros_2025_banco_andino.sql',
    'Sql/06_DML_metas_kpis_banco_andino.sql',
    'Sql/07_DDL_DML_mejoras_proyecto.sql',
    'Sql/08_DML_crear_castor_perez.sql'
]

def load_sql_file(file_path):
    print(f"Loading {file_path}...")
    start_time = time.time()
    
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} does not exist!")
        return False
        
    with open(file_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # We execute using a transaction block
    with engine.begin() as conn:
        try:
            # Psycopg2 supports multiple statements in one execute call
            conn.execute(text(sql_content))
            elapsed = time.time() - start_time
            print(f"Successfully executed {file_path} in {elapsed:.2f} seconds.")
            return True
        except Exception as e:
            print(f"Error executing {file_path}:")
            print(e)
            return False

def main():
    print("Starting database initialization...")
    total_start = time.time()
    
    for sql_file in SQL_FILES:
        success = load_sql_file(sql_file)
        if not success:
            print("Database initialization failed at step:", sql_file)
            sys.exit(1)
            
    print(f"Database initialized successfully in {time.time() - total_start:.2f} seconds!")

if __name__ == '__main__':
    main()
