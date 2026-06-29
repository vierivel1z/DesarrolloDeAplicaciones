import os
import sys

# Setup environment
script_dir = os.path.dirname(os.path.abspath(__file__))
venv_site_packages = os.path.join(script_dir, '.venv', 'Lib', 'site-packages')
if os.path.exists(venv_site_packages):
    sys.path.insert(0, venv_site_packages)
sys.path.append(script_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(script_dir, '.env'))

from sqlalchemy import text
from app.core.cfg_database import engine
from app.core.cfg_security import hashear_password

def main():
    print("Fixing passwords in DB for bcrypt version compatibility...")
    
    # Generate new valid hash for 'demo1234'
    new_hash = hashear_password("demo1234")
    print(f"New valid hash for 'demo1234': {new_hash}")
    
    with engine.begin() as conn:
        # Update admin users
        res = conn.execute(
            text("UPDATE dusuarios_admin SET password_hash = :new_hash"),
            {"new_hash": new_hash}
        )
        print(f"Updated {res.rowcount} admin users.")
        
        # Update homebanking users
        res2 = conn.execute(
            text("UPDATE usuarios_homebanking SET password_hash = :new_hash"),
            {"new_hash": new_hash}
        )
        print(f"Updated {res2.rowcount} homebanking users.")
        
    print("Done! You can now log in with 'demo1234'.")

if __name__ == '__main__':
    main()
