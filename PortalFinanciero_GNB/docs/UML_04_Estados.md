# Diagrama 4: Diagrama de Estados - Ciclo de Vida del Onboarding Digital GNB

**Propósito:** Representa la máquina de estados por la que transita la identidad digital del cliente y sus credenciales antes de ser activas en el Core Bancario.

```plantuml
@startuml
skinparam stateBackgroundColor white

[*] --> INICIO_REGISTRO : Cliente accede al portal

state INICIO_REGISTRO {
  [*] --> Validación_DNI
  Validación_DNI --> Formulario_Datos : DNI Válido (RENIEC Mock)
  Formulario_Datos --> Validación_Biométrica_Mock
  Validación_Biométrica_Mock --> Creación_Credenciales
}

INICIO_REGISTRO --> PENDIENTE_VERIFICACION : Submit Formulario
PENDIENTE_VERIFICACION --> ACTIVO : OTP Email Confirmado
PENDIENTE_VERIFICACION --> RECHAZADO : Timeout OTP / Fraude Detectado

ACTIVO --> [*] : Generación de Cuenta de Ahorro\ny Accesos Homebanking
RECHAZADO --> [*] : Bloqueo Preventivo

@enduml
```
