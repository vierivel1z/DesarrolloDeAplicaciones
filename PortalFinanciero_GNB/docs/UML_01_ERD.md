# Diagrama 1: Modelo de Entidad-Relación (ERD) - Consistencia y Datos Calibrados

**Propósito:** Demuestra la integridad referencial, el aislamiento de credenciales administrativas en `dusuarios_admin`, la persistencia de URLs en `fevalconsumo` y la trazabilidad de gestiones en `fgestiones_cobranza`.

```plantuml
@startuml
skinparam roundcorner 5
skinparam shadowing false
skinparam classBackgroundColor white
left to right direction

' ==========================================
' Entidades Principales
' ==========================================
entity "dcliente" as dcliente {
  * pkcliente : INT
  --
  numerodocumentoidentidad : VARCHAR
  puntos_recompensas : INT
}

entity "dusuarios_admin" as dusuarios_admin {
  * pkusuario : INT
  --
  username : VARCHAR
  role : VARCHAR
}

entity "dprovisiones_banco" as dprovisiones_banco {
  * id_provision : INT
  --
  monto_provisiones_totales : DECIMAL
}

' ==========================================
' Módulo de Origen (Onboarding y Riesgos)
' ==========================================
entity "dsolicitud" as dsolicitud {
  * pksolicitud : INT
  --
  pkcliente : INT <<FK>>
  pksolicitudestado : INT
  montosolicitudcredito : DECIMAL
}

entity "fevalconsumo" as fevalconsumo {
  * pkevalconsumo : INT
  --
  pksolicitud : INT <<FK>>
  url_doc_identidad : VARCHAR
  url_sustento_ingresos : VARCHAR
}

' ==========================================
' Módulo de Cuentas (Activas y Pasivas)
' ==========================================
entity "fagcuentacredito" as fagcuentacredito {
  * pkcuentacredito : INT
  --
  pkcliente : INT <<FK>>
  montosaldocapital : DECIMAL
  diasatrasocredito : INT
  flagjudicial : VARCHAR
  flagcastigado : VARCHAR
}

entity "fplanpagomes" as fplanpagomes {
  * pkplanpago : INT
  --
  pkcuentacredito : INT <<FK>>
  nrocuota : INT
  fechavencimientopagocuota : DATE
  montocapitalprogramado : DECIMAL
  codestadocuota : VARCHAR
}

entity "fagcuentabancaria" as fagcuentabancaria {
  * pkcuentabancaria : INT
  --
  pkcliente : INT <<FK>>
  numerocuenta : VARCHAR
  montosaldodisponible : DECIMAL
}

' ==========================================
' Módulo Transaccional y Mora
' ==========================================
entity "foperaciones" as foperaciones {
  * pkoperacion : INT
  --
  pkcuenta : INT <<FK>>
  monto : DECIMAL
  glosa : VARCHAR
}

entity "fgestiones_cobranza" as fgestiones_cobranza {
  * id_gestion : INT
  --
  id_solicitud : INT <<FK>>
  usuario_gestor : VARCHAR
  canal_contacto : VARCHAR
}

' ==========================================
' Relaciones (Connections)
' ==========================================
dcliente ||--o{ dsolicitud
dcliente ||--o{ fagcuentacredito
dcliente ||--o{ fagcuentabancaria

dsolicitud ||--o| fevalconsumo
dsolicitud ||--o{ fgestiones_cobranza
dsolicitud |o--o| fagcuentacredito : genera

fagcuentacredito ||--o{ fplanpagomes

fagcuentacredito ||--o{ foperaciones
fagcuentabancaria ||--o{ foperaciones

@enduml
```
