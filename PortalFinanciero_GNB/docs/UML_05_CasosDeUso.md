# Diagrama 5: Diagrama de Casos de Uso — Sistema Completo Banco GNB

**Propósito:** Muestra todos los actores del sistema y las funcionalidades que cada uno puede ejecutar, evidenciando la separación de responsabilidades por rol.

```plantuml
@startuml
skinparam roundcorner 10
skinparam actorStyle awesome
left to right direction

actor "Cliente" as CLI
actor "Asesor (MAKER)" as MKR
actor "Jefe Regional / Riesgos\n(CHECKER_1)" as CHK1
actor "Mesa de Control\n(CHECKER_2)" as CHK2
actor "Comité de Crédito\n(COMITE)" as COM
actor "Directorio\n(SUPERADMIN)" as SA

rectangle "Homebanking GNB" {
  usecase "Registrarse digitalmente" as UC_REG
  usecase "Login Homebanking (JWT)" as UC_LOGIN_HB
  usecase "Ver saldos y movimientos" as UC_SALDOS
  usecase "Transferir entre cuentas" as UC_TRANSF
  usecase "Pago de servicios" as UC_PAGO
  usecase "Solicitar crédito\n(con sustento Cloudinary)" as UC_SOLICITAR
  usecase "Firmar contrato (OTP)" as UC_OTP
  usecase "Ver cuotas y cronograma" as UC_CUOTAS
}

rectangle "Core Bancario (Portal Financiero)" {
  usecase "Login Core (JWT + Rol)" as UC_LOGIN_CORE
  usecase "Evaluar solicitud\n(Score PD, DTI)" as UC_EVALUAR
  usecase "Aprobar crédito\nNivel 1 / Nivel 2" as UC_APROBAR
  usecase "Resolver Comité\nNivel 3" as UC_COMITE
  usecase "Desembolsar crédito" as UC_DESEMBOLSAR
  usecase "Ver cartera morosa\n(Bandas SBS)" as UC_MORA
  usecase "Registrar gestión\nde cobranza" as UC_GESTION
  usecase "Derivar a Judicial\n(≥ 121 días)" as UC_JUDICIAL
  usecase "Castigar deuda\n(> 180 días)" as UC_CASTIGO
  usecase "Ejecutar EOD\n(Ahorros / Mora)" as UC_EOD
  usecase "Configurar parámetros\n(TEA, montos)" as UC_PARAMS
  usecase "Ver KPIs mora SBS" as UC_KPIS
}

' Relaciones Cliente
CLI --> UC_REG
CLI --> UC_LOGIN_HB
CLI --> UC_SALDOS
CLI --> UC_TRANSF
CLI --> UC_PAGO
CLI --> UC_SOLICITAR
CLI --> UC_OTP
CLI --> UC_CUOTAS

' Relaciones MAKER
MKR --> UC_LOGIN_CORE
MKR --> UC_EVALUAR
MKR --> UC_MORA
MKR --> UC_GESTION
MKR --> UC_KPIS

' Relaciones CHECKER_1
CHK1 --> UC_LOGIN_CORE
CHK1 --> UC_APROBAR
CHK1 --> UC_MORA
CHK1 --> UC_KPIS

' Relaciones CHECKER_2
CHK2 --> UC_LOGIN_CORE
CHK2 --> UC_APROBAR
CHK2 --> UC_DESEMBOLSAR
CHK2 --> UC_JUDICIAL
CHK2 --> UC_EOD
CHK2 --> UC_KPIS

' Relaciones COMITE
COM --> UC_LOGIN_CORE
COM --> UC_COMITE
COM --> UC_KPIS

' Relaciones SUPERADMIN
SA --> UC_LOGIN_CORE
SA --> UC_CASTIGO
SA --> UC_EOD
SA --> UC_PARAMS
SA --> UC_KPIS
SA --> UC_APROBAR
SA --> UC_COMITE

@enduml
```
