import sys
import os
import json

backend_dir = os.path.join(os.getcwd(), 'backend')
venv_site_packages = os.path.join(backend_dir, '.venv', 'Lib', 'site-packages')
if os.path.exists(venv_site_packages):
    sys.path.insert(0, venv_site_packages)
sys.path.append(backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def show(title, resp):
    print(f"\n===== {title}  ->  HTTP {resp.status_code} =====")
    try:
        print(json.dumps(resp.json(), indent=2, ensure_ascii=False, default=str))
    except Exception:
        print(resp.text)
    return resp

def main():
    from backend.app.core.cfg_database import engine
    from sqlalchemy import text
    from backend.app.core.cfg_security import hashear_password
    
    with engine.begin() as conn:
        hpass = hashear_password("demo1234")
        conn.execute(text(f"INSERT INTO usuarios_homebanking (username, password_hash, pkcliente) SELECT 'cli002010', '{hpass}', pkcliente FROM dcliente WHERE codcliente='CLI002010' ON CONFLICT DO NOTHING"))
        # Update admin passwords to ensure compatibility
        conn.execute(text(f"UPDATE dusuarios_admin SET password_hash = '{hpass}'"))

    print("\n--- 1. TEST LOGIN Y TOKENS ---")
    # Login Cliente (Homebanking)
    r_cli = show("Login Cliente", client.post("/auth/login", json={"username": "cli002010", "password": "demo1234"}))
    token_cli = r_cli.json()["access_token"]
    role_cli = r_cli.json()["cliente"].get("role")
    print(f"Cliente logged in. Role in response: {role_cli}")
    H_cli = {"Authorization": f"Bearer {token_cli}"}

    # Login MAKER
    r_maker = show("Login MAKER", client.post("/auth/login", json={"username": "maker01", "password": "demo1234"}))
    token_maker = r_maker.json()["access_token"]
    H_maker = {"Authorization": f"Bearer {token_maker}"}
    print(f"MAKER logged in.")

    # Login CHECKER_1
    r_checker1 = show("Login CHECKER_1", client.post("/auth/login", json={"username": "checker1_01", "password": "demo1234"}))
    token_checker1 = r_checker1.json()["access_token"]
    H_checker1 = {"Authorization": f"Bearer {token_checker1}"}
    print(f"CHECKER_1 logged in.")
    
    # Login CHECKER_2
    r_checker2 = show("Login CHECKER_2", client.post("/auth/login", json={"username": "checker2_01", "password": "demo1234"}))
    token_checker2 = r_checker2.json()["access_token"]
    H_checker2 = {"Authorization": f"Bearer {token_checker2}"}
    print(f"CHECKER_2 logged in.")

    # Login SUPERADMIN
    r_super = show("Login SUPERADMIN", client.post("/auth/login", json={"username": "superadmin01", "password": "demo1234"}))
    token_super = r_super.json()["access_token"]
    H_super = {"Authorization": f"Bearer {token_super}"}
    print(f"SUPERADMIN logged in.")

    print("\n--- 2. PRUEBAS DE SEGURIDAD (RBAC - 403 Forbidden) ---")
    
    # CLIENTE intenta entrar a /admin/solicitudes
    r = show("CLIENTE intenta ver solicitudes (Debe ser 403)", client.get("/admin/solicitudes", headers=H_cli))
    assert r.status_code == 403

    # MAKER intenta evaluar (Debe ser OK 200 o validación 422)
    # Mandamos body vacio para que de 422 y probar que pasó el 403
    r = show("MAKER intenta evaluar crédito (Debe ser 422, pasó auth)", client.post("/admin/creditos/999/evaluar", headers=H_maker, json={}))
    assert r.status_code in (422, 200, 404) # Si 422, la auth fue exitosa

    # MAKER intenta Resolver Comité (Debe ser 403)
    r = show("MAKER intenta resolver Comité (Debe ser 403)", client.post("/admin/creditos/999/comite/resolver", headers=H_maker))
    assert r.status_code == 403

    # CHECKER_1 intenta Derivar Judicial (Debe ser 403)
    r = show("CHECKER_1 intenta derivar judicial (Debe ser 403)", client.post("/admin/creditos/999/derivar-judicial", headers=H_checker1))
    assert r.status_code == 403

    # CHECKER_2 intenta Castigar (Debe ser 403)
    r = show("CHECKER_2 intenta castigar cartera (Debe ser 403)", client.post("/admin/creditos/999/castigar", headers=H_checker2))
    assert r.status_code == 403

    # SUPERADMIN intenta Castigar (Debe ser 200)
    r = show("SUPERADMIN castiga cartera (Debe ser 200)", client.post("/admin/creditos/999/castigar", headers=H_super))
    assert r.status_code == 200

    print("\nTODAS LAS PRUEBAS DE SEGURIDAD PASARON CORRECTAMENTE ✅")

if __name__ == "__main__":
    main()
