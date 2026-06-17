import os
import sys

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
from app.core.cfg_security import hashear_password

def main():
    print("Generating homebanking users for all clients...")
    
    password_hash = hashear_password("demo1234")
    print(f"Bcrypt hash generated for 'demo1234': {password_hash}")
    
    with engine.begin() as conn:
        # 1. Fetch all clients from dcliente
        clients = conn.execute(text("SELECT pkcliente, TRIM(codcliente) as codcliente FROM dcliente")).all()
        print(f"Found {len(clients)} clients in dcliente.")
        
        # 2. Insert into usuarios_homebanking
        count = 0
        for client in clients:
            pkcliente = client.pkcliente
            username = client.codcliente.lower()
            
            # Check if user already exists
            exists = conn.execute(
                text("SELECT 1 FROM usuarios_homebanking WHERE pkcliente = :pk"),
                {"pk": pkcliente}
            ).scalar()
            
            if not exists:
                conn.execute(
                    text("""
                        INSERT INTO usuarios_homebanking (pkcliente, username, password_hash, activo, bloqueado)
                        VALUES (:pkcliente, :username, :password_hash, 'S', 'N')
                    """),
                    {
                        "pkcliente": pkcliente,
                        "username": username,
                        "password_hash": password_hash
                    }
                )
                count += 1
                
        print(f"Created {count} homebanking users successfully.")

if __name__ == '__main__':
    main()
