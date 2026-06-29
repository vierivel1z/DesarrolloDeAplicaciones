# Diagrama 7: Diagrama de Secuencia — Módulo de Mora R1·R2·R3

**Propósito:** Detalla la secuencia temporal del flujo de recuperaciones: desde la consulta de cartera morosa (R1), el registro de gestiones de cobranza (R2), hasta las transiciones de estado irreversibles a Judicial y Castigo (R3), con las validaciones de umbrales y permisos en cada paso.

```plantuml
@startuml
skinparam sequenceArrowColor #336699
skinparam sequenceGroupBodyBackgroundColor #f0f5ff

actor "Asesor\n(MAKER)" as Asesor
actor "Mesa de Control\n(CHECKER_2)" as Mesa
actor "Directorio\n(SUPERADMIN)" as Dir

participant "AdminMoraPage\n(Frontend)" as FE
participant "route_mora.py" as Route
participant "ctrl_mora.py" as Ctrl
participant "fgestiones_cobranza" as Gestiones
database "fagcuentacredito\nfplanpagomes" as DB

== R1: Consulta de Cartera Morosa por Bandas ==

Asesor -> FE: Accede a "Procesos Batch EOD"
FE -> Route: GET /mora/cartera\n(JWT MAKER)
Route -> Ctrl: listar_cartera_mora()
Ctrl -> DB: SELECT con CASE WHEN diasatraso:\n≤8=Preventiva, ≤30=Temprana,\n≤120=Tardía, >120=Judicial/Castigo
DB --> Ctrl: Lista con banda, días, saldo capital
Ctrl --> Route: JSON cartera + banda clasificada
Route --> FE: Tabla con semáforo de colores

note over FE: KPIs mostrados:\n- Mora Global (%)\n- Cartera Pesada (%)\n- Cobertura de Provisiones

== R2: Registro de Gestión de Cobranza ==

Asesor -> FE: Selecciona cuenta, elige canal\n(Llamada/SMS/Visita), ingresa resultado
FE -> Route: POST /mora/gestiones\n{canal, codigo_respuesta, compromiso}
Route -> Ctrl: registrar_gestion()
Ctrl -> DB: SELECT diasatrasocredito FROM fagcuentacredito
DB --> Ctrl: dias_atraso

alt dias_atraso > 30
  Ctrl -> DB: UPDATE dcliente SET puntos_recompensas = 0
  note right: Penalización irreversible\npor mora mayor a 30 días
end

Ctrl -> Gestiones: INSERT fgestiones_cobranza\n(gestor, canal, código, comentarios, compromiso)
Gestiones --> Ctrl: id_gestion
Ctrl --> Route: {mensaje, id_gestion, penalizacion}
Route --> FE: Gestión registrada ✓

FE -> Route: GET /mora/gestiones/{id_solicitud}
Route --> FE: Historial completo de gestiones

== R3: Transición a Cartera Judicial (≥ 121 días) ==

Mesa -> FE: Click "Derivar a Judicial" (botón ⚖️)
FE -> Route: POST /admin/creditos/{id}/derivar-judicial\n(JWT CHECKER_2)
Route -> Ctrl: aplicar_transicion(pksolicitud, "judicial")
Ctrl -> DB: SELECT diasatrasocredito FROM fagcuentacredito\nJOIN dsolicitud

alt dias < 121
  Ctrl --> Route: ValueError: "No cumple umbral\n(mínimo 121 días)"
  Route --> FE: HTTP 400 — Error mostrado al usuario
else dias >= 121
  Ctrl -> DB: UPDATE fagcuentacredito SET flagjudicial = 'S'
  Ctrl -> DB: UPDATE dsolicitud SET pksolicitudestado = 4
  Ctrl --> Route: {mensaje: "Transicionado a judicial"}
  Route --> FE: Éxito — Cuenta marcada Judicial
end

== R3: Castigo Contable (> 180 días) ==

Dir -> FE: Click "Castigo Contable" (botón 🗂️)\n+ Confirmación en modal
FE -> Route: POST /admin/creditos/{id}/castigar\n(JWT SUPERADMIN)
Route -> Ctrl: aplicar_transicion(pksolicitud, "castigo")
Ctrl -> DB: SELECT dias + saldo + pkmoneda + pkagencia

alt dias <= 180
  Ctrl --> Route: ValueError: "No cumple umbral\n(mayor a 180 días)"
  Route --> FE: HTTP 400 — Castigo bloqueado
else dias > 180
  Ctrl -> DB: UPDATE fagcuentacredito\nSET montosaldocapital = 0.0, flagcastigado = 'S'
  Ctrl -> DB: UPDATE dsolicitud SET pksolicitudestado = 5
  Ctrl -> DB: INSERT foperaciones\n(codtipkar='DE', glosa='CASTIGO DE CARTERA\nCREDITICIA AUTORIZADO POR DIRECTORIO')
  Ctrl --> Route: {mensaje: "Castigo aplicado exitosamente"}
  Route --> FE: Éxito — Balance reducido a S/ 0.00
end

@enduml
```
