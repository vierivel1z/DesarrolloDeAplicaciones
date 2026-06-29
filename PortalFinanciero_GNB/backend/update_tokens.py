import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
venv_site_packages = os.path.join(script_dir, '.venv', 'Lib', 'site-packages')

if os.path.exists(venv_site_packages):
    sys.path.insert(0, venv_site_packages)

from dotenv import load_dotenv
load_dotenv(os.path.join(script_dir, '.env'))

from sqlalchemy import text
from app.core.cfg_database import engine
from app.core.cfg_security import hashear_password

def main():
    print("Agregando token_hash a las tablas y configurando 'token1234'...")
    
    token_hash = hashear_password("token1234")
    
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE usuarios_homebanking ADD COLUMN IF NOT EXISTS token_hash VARCHAR(255);"))
            print("Columna token_hash agregada a usuarios_homebanking.")
        except Exception as e:
            print(f"Error o ya existe en usuarios_homebanking: {e}")

        try:
            conn.execute(text("ALTER TABLE dusuarios_admin ADD COLUMN IF NOT EXISTS token_hash VARCHAR(255);"))
            print("Columna token_hash agregada a dusuarios_admin.")
        except Exception as e:
            print(f"Error o ya existe en dusuarios_admin: {e}")
            
        conn.execute(
            text("UPDATE usuarios_homebanking SET token_hash = :hash"),
            {"hash": token_hash}
        )
        
        conn.execute(
            text("UPDATE dusuarios_admin SET token_hash = :hash"),
            {"hash": token_hash}
        )
        
    print("Token_hash actualizado exitosamente para todos los usuarios.")

if __name__ == '__main__':
    main()
