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
from sqlalchemy import text

from backend.main import app
from backend.app.core.cfg_database import engine

client = TestClient(app)

def show(title, resp):
    print(f"\n===== {title}  ->  HTTP {resp.status_code} =====")
    try:
        print(json.dumps(resp.json(), indent=2, ensure_ascii=False, default=str))
    except Exception:
        print(resp.text)

def main():
    USER = "cli000007"
    PWD = "demo1234"
    
    # Login
    r = client.post("/auth/login", json={"username": USER, "password": PWD})
    token = r.json()["access_token"]
    H = {"Authorization": f"Bearer {token}"}
    
    # Set client to Independent, and update DNI to test SBS
    with engine.begin() as conn:
        cli = conn.execute(text("SELECT pkcliente FROM dcliente WHERE codcliente = :c"), {"c": USER}).scalar()
        conn.execute(
            text("UPDATE dcliente SET numerodocumentoidentidad = 'DNI00004', tipo_trabajador = 'I', montoingresoneto = 3000 WHERE pkcliente = :pk"),
            {"pk": cli}
        )

    print("\n--- CASO 1: RECHAZO AUTOMÁTICO POR SBS (SEMÁFORO ROJO) ---")
    body_rechazo = {
        "numero_documento": "DNI00004",
        "moneda": "PEN",
        "monto": 20000,
        "plazo": 24,
        "archivo_sustento_url": "http://cloudinary.com/doc",
        "codtipocredito": "CO",
        "codactividadeconomica": "0111",
        "ingreso_neto_mensual": 3000
    }
    r1 = client.post("/creditos/solicitar", headers=H, json=body_rechazo)
    show("Solicitud Rechazada", r1)

    # Set client to DNI00001 (Verde) and Dependiente but low income
    with engine.begin() as conn:
        conn.execute(
            text("UPDATE dcliente SET numerodocumentoidentidad = 'DNI00001', tipo_trabajador = 'D', montoingresoneto = 1000 WHERE pkcliente = :pk"),
            {"pk": cli}
        )
    print("\n--- CASO 2: RECHAZO AUTOMÁTICO POR INGRESO (DEPENDIENTE < 1200) ---")
    body_rechazo_ingreso = body_rechazo.copy()
    body_rechazo_ingreso["numero_documento"] = "DNI00001"
    body_rechazo_ingreso["ingreso_neto_mensual"] = 1000
    r2 = client.post("/creditos/solicitar", headers=H, json=body_rechazo_ingreso)
    show("Solicitud Rechazada Ingreso", r2)

    # Set client to DNI00001 and Dependiente with enough income
    with engine.begin() as conn:
        conn.execute(
            text("UPDATE dcliente SET montoingresoneto = 3000 WHERE pkcliente = :pk"),
            {"pk": cli}
        )

    print("\n--- CASO 3: SOLICITUD EXITOSA (NIVEL 3 - COMITÉ DE CRÉDITO) ---")
    body_ok = body_rechazo_ingreso.copy()
    body_ok["ingreso_neto_mensual"] = 3000
    body_ok["monto"] = 60000 # > 50k -> Comité
    
    r3 = client.post("/creditos/solicitar", headers=H, json=body_ok)
    show("Solicitud Exitosa", r3)
    pksolicitud = r3.json().get("pksolicitud")

    if pksolicitud:
        print("\n--- FLUJO MAKER/CHECKER ---")
        
        # 1. ADMIN TOKEN 
        r_admin = client.post("/auth/login", json={"username": "admin", "password": "admin1234"})
        admin_token = r_admin.json()["access_token"]
        H_admin = {"Authorization": f"Bearer {admin_token}"}
        
        # MAKER Evalúa
        H_maker = {**H_admin, "X-User-Role": "MAKER"}
        r_eval = client.post(f"/admin/creditos/{pksolicitud}/evaluar", headers=H_maker, json={
            "score_pd": 5.0,
            "ingreso_neto_mensual": 3000.0,
            "comentarios_analista": "Todo ok"
        })
        show("MAKER Evalúa", r_eval)
        
        # Checker 2 intenta aprobar antes que el 1
        H_checker2 = {**H_admin, "X-User-Role": "CHECKER_2"}
        r_c2_fail = client.post(f"/admin/creditos/{pksolicitud}/aprobar", headers=H_checker2, json={
            "tea_aprobada": 15.0
        })
        show("CHECKER 2 Intenta Aprobar sin Checker 1", r_c2_fail)

        # Checker 1 (Riesgos) firma
        H_checker1 = {**H_admin, "X-User-Role": "CHECKER_1"}
        r_c1 = client.post(f"/admin/creditos/{pksolicitud}/aprobar", headers=H_checker1, json={
            "tea_aprobada": 15.0
        })
        show("CHECKER 1 Firma", r_c1)

        # Checker 2 (Mesa Control) firma
        r_c2_ok = client.post(f"/admin/creditos/{pksolicitud}/aprobar", headers=H_checker2, json={
            "tea_aprobada": 15.0
        })
        show("CHECKER 2 Firma y Aprueba", r_c2_ok)

        # Desembolso
        r_des = client.post(f"/admin/creditos/{pksolicitud}/desembolsar", headers=H_checker2)
        show("Desembolso", r_des)
        
        # Detalle de la Solicitud (Cronograma y Scoring)
        r_det = client.get(f"/admin/solicitudes/{pksolicitud}/detalle", headers=H_admin)
        show("Detalle Solicitud y Scoring", r_det)


if __name__ == "__main__":
    main()
