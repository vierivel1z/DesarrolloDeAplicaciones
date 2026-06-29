# Diagrama 9: Diagrama de Clases — Capa de Repositorios y Controladores

**Propósito:** Representa la arquitectura interna del backend (Python/FastAPI) mostrando la estructura de clases, métodos principales y dependencias entre la capa de controladores y la capa de repositorios, evidenciando el patrón de diseño sin ORM (SQL crudo con SQLAlchemy Core).

```plantuml
@startuml
skinparam classBackgroundColor white
skinparam classBorderColor #336699
skinparam ArrowColor #336699
skinparam shadowing false

' =============================================
' CAPA DE RUTAS (Presentación)
' =============================================
package "Capa Rutas (FastAPI Routers)" {
  class "route_creditos.py" as RC {
    + POST /solicitar
    + GET /solicitudes
    + POST /creditos/{id}/evaluar
    + POST /creditos/{id}/aprobar
    + POST /creditos/{id}/desembolsar
    + POST /creditos/{id}/comite/resolver
  }
  class "route_mora.py" as RM {
    + GET /mora/cartera
    + POST /mora/gestiones
    + GET /mora/gestiones/{id}
    + POST /mora/eod
  }
  class "route_cuentas.py" as RCU {
    + GET /cuentas/ahorro
    + GET /cuentas/credito
    + GET /cuentas/credito/{cod}/cuotas
    + GET /cuentas/movimientos
  }
  class "route_admin.py" as RA {
    + GET /admin/stats
    + GET /admin/kpis-mora
    + POST /admin/creditos/{id}/derivar-judicial
    + POST /admin/creditos/{id}/castigar
    + POST /admin/eod/ahorros
    + PUT /admin/creditos/parametros
  }
}

' =============================================
' CAPA DE CONTROLADORES (Dominio)
' =============================================
package "Capa Controladores (Lógica de Negocio)" {
  class "ctrl_creditos.py" as CC {
    + solicitar(conn, pkcliente, monto, plazo, ...): dict
    + evaluar_credito(conn, pksolicitud, score_pd, dti, ...): dict
    + gestionar_aprobacion(conn, pksolicitud, tea, rol): dict
    + desembolsar(conn, pksolicitud): dict
    - _calcular_cuota_francesa(monto, tea, plazo): Decimal
    - _calcular_dti(cuota, ingreso): float
  }

  class "ctrl_mora.py" as CM {
    + listar_cartera_mora(conn): list[dict]
    + registrar_gestion(conn, gestion, codpersonal): dict
    + aplicar_transicion(conn, pksolicitud, tipo): dict
    + procesar_fin_de_dia_mora(conn): dict
    - _clasificar_categoria_sbs(dias): int
  }

  class "ctrl_cuentas.py" as CCU {
    + saldos_cliente(conn, pkcliente): dict
    + movimientos(conn, pkcliente): list
    + cuotas_credito(conn, codcuentacredito): list
    + creditos_cliente(conn, pkcliente): list
  }

  class "ctrl_ahorros_eod.py" as CEOD {
    + procesar_eod_ahorros(conn): dict
    + capitalizar_ahorro_rolando(conn): dict
  }
}

' =============================================
' CAPA DE REPOSITORIOS (Acceso a Datos)
' =============================================
package "Capa Repositorios (SQL Crudo)" {
  class "repo_creditos.py" as REP_C {
    + obtener_info_cliente_elegibilidad(conn, pkcliente): dict
    + consultar_semaforo_sbs(conn, ndoc): int
    + crear_solicitud(conn, ...): dict
    + actualizar_evaluacion_solicitud(conn, pk, score, dti, ...): None
    + gestionar_aprobacion(conn, pk, tea, rol): None
    + registrar_firma_checker(conn, pk, nivel, rol): None
    + desembolsar_solicitud(conn, pk): dict
    + listar_solicitudes(conn): list
    + obtener_detalle_solicitud(conn, pk): dict
  }

  class "repo_cuentas.py" as REP_CU {
    + saldos(conn, pkcliente): dict
    + movimientos(conn, pkcliente): list
    + listar_cuotas(conn, codcuentacredito): list
    + creditos_activos(conn, pkcliente): list
  }

  class "repo_parametros.py" as REP_P {
    + obtener_parametros(conn): dict
    + actualizar_parametros(conn, ...): dict
  }
}

' =============================================
' INFRAESTRUCTURA
' =============================================
package "Infraestructura" {
  class "cfg_database.py" as DB {
    + engine: Engine
    + get_db(): Connection
  }
  class "cfg_security.py" as SEC {
    + crear_access_token(data: dict): str
    + decodificar_token(token: str): dict
    + verificar_password(plain, hashed): bool
    + hashear_password(plain): str
    + <<class>> RequireRole
      - allowed_roles: list[str]
      + __call__(creds): str
  }
}

' =============================================
' DEPENDENCIAS
' =============================================
RC --> CC : invoca
RM --> CM : invoca
RCU --> CCU : invoca
RA --> CM : invoca (mora, castigo)
RA --> CC : invoca (desembolso)
RA --> CEOD : invoca (EOD)

CC --> REP_C : delega SQL
CC --> REP_P : consulta parámetros
CM --> REP_C : consulta solicitudes
CCU --> REP_CU : delega SQL

RC ..> SEC : Depends(RequireRole)
RM ..> SEC : Depends(RequireRole)
RA ..> SEC : Depends(RequireRole)

REP_C ..> DB : Connection
REP_CU ..> DB : Connection
REP_P ..> DB : Connection
CM ..> DB : Connection directa

@enduml
```
