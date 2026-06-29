import sys
import os

backend_dir = os.path.join(os.getcwd(), 'backend')
venv_site_packages = os.path.join(backend_dir, '.venv', 'Lib', 'site-packages')
if os.path.exists(venv_site_packages):
    sys.path.insert(0, venv_site_packages)
sys.path.append(backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

from sqlalchemy import text
from backend.app.core.cfg_database import engine
from backend.app.controllers import ctrl_creditos

def test_flujo():
    with engine.connect() as conn:
        cli = conn.execute(text("SELECT MIN(pkcliente) FROM dcliente")).scalar()
        if not cli:
            print("No hay clientes en la DB.")
            return
        
        print("\n--- PREPARANDO CLIENTE DNI00004 (SBS ROJO) ---")
        conn.execute(
            text("UPDATE dcliente SET numerodocumentoidentidad = 'DNI00004', tipo_trabajador = 'I', montoingresoneto = 3000 WHERE pkcliente = :pk"),
            {"pk": cli}
        )
        conn.commit()
        
        try:
            ctrl_creditos.solicitar(
                conn=conn, pkcliente=cli, montosolicitud=20000, plazo=24,
                codtipocredito="CO", codactividadeconomica="0111",
                montoingresoneto=3000, archivo_sustento_url="http://test.com"
            )
        except Exception as e:
            print("Resultado (Rechazo SBS 400):", getattr(e, 'detail', str(e)))

        print("\n--- PREPARANDO CLIENTE DNI00001 (DEPENDIENTE, INGRESOS BAJOS) ---")
        conn.execute(
            text("UPDATE dcliente SET numerodocumentoidentidad = 'DNI00001', tipo_trabajador = 'D', montoingresoneto = 1000 WHERE pkcliente = :pk"),
            {"pk": cli}
        )
        conn.commit()
        try:
            ctrl_creditos.solicitar(
                conn=conn, pkcliente=cli, montosolicitud=20000, plazo=24,
                codtipocredito="CO", codactividadeconomica="0111",
                montoingresoneto=1000, archivo_sustento_url="http://test.com"
            )
        except Exception as e:
            print("Resultado (Rechazo Ingresos 400):", getattr(e, 'detail', str(e)))

        print("\n--- PREPARANDO CLIENTE DNI00001 (COMITÉ CRÉDITO 60K) ---")
        conn.execute(
            text("UPDATE dcliente SET montoingresoneto = 15000 WHERE pkcliente = :pk"),
            {"pk": cli}
        )
        conn.commit()
        res = ctrl_creditos.solicitar(
            conn=conn, pkcliente=cli, montosolicitud=60000, plazo=24,
            codtipocredito="CO", codactividadeconomica="0111",
            montoingresoneto=15000, archivo_sustento_url="http://test.com"
        )
        print("Solicitud Aprobada Inicialmente:", res)
        pksolicitud = res["pksolicitud"]

        print("\n--- FLUJO MAKER/CHECKER ---")
        ctrl_creditos.evaluar_credito(conn, pksolicitud, 5.0, 15000.0, "Aprobado por el analista MAKER")
        print("MAKER Evaluó exitosamente.")

        print("\nChecker 2 intenta aprobar (Debería fallar por orden)")
        try:
            ctrl_creditos.gestionar_aprobacion(conn, pksolicitud, 15.0, "CHECKER_2")
        except Exception as e:
            print("Resultado:", getattr(e, 'detail', str(e)))
        
        print("\nChecker 1 (Riesgos) firma")
        res_c1 = ctrl_creditos.gestionar_aprobacion(conn, pksolicitud, 15.0, "CHECKER_1")
        print("Resultado:", res_c1)
        
        print("\nChecker 2 (Mesa de Control) firma")
        res_c2 = ctrl_creditos.gestionar_aprobacion(conn, pksolicitud, 15.0, "CHECKER_2")
        print("Resultado:", res_c2)

        print("\nDesembolso final y generación de cronograma")
        res_des = ctrl_creditos.desembolsar(conn, pksolicitud)
        print("Mensaje de desembolso:", res_des["mensaje"])
        print("Cuenta Transaccional:", res_des["cuenta_transaccional"])

if __name__ == '__main__':
    test_flujo()
