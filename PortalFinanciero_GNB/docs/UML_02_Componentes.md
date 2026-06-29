# Diagrama 2: Diagrama de Componentes - Arquitectura Limpia por Capas

**Propósito:** Muestra el flujo unidireccional y desacoplado, donde los controladores orquestan la lógica y los repositorios ejecutan SQL crudo sin ORM, garantizando velocidad en el Core.

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam componentBackgroundColor white
left to right direction

cloud "Cloudinary API\n(Almacenamiento Sustentos)" as cloudinary
cloud "Gateway Notificaciones\n(SMTP / SMS)" as notif_gateway

package "Ecosistema Banco GNB" {

  node "Portal Financiero (Core Bancario)" {
    [Frontend Core\n(React - Empleados)] as core_ui
    
    package "Backend Core (FastAPI)" {
      [Rutas\n(Capa Presentación)] as core_routes
      [Controladores\n(Capa Dominio)] as core_ctrl
      [Repositorios\n(Capa Acceso Datos)] as core_repo
    }
    
    note right of core_ctrl
      **Lógica Core:**
      - Mora (diasatrasocredito)
      - KPIs SBS (Global, Pesada, Cobertura)
      - RBAC (Maker/Checker)
    end note
  }

  node "Homebanking GNB (Clientes)" {
    [Frontend Homebanking\n(React - Clientes)] as hb_ui
    
    package "Backend Homebanking (FastAPI)" {
      [Rutas Homebanking] as hb_routes
      [Controladores HB] as hb_ctrl
      [Repositorios HB] as hb_repo
    }
    
    note right of hb_ctrl
      **Lógica Homebanking:**
      - Tasa Efectiva Mensual (TEA a TEM)
      - Cuota Francesa (Monto * i / 1-(1+i)^-n)
      - Capacidad Pago (DTI <= 40%)
    end note
  }

  database "PostgreSQL" {
    [Base de Datos Centralizada\n(dcliente, dsolicitud, etc.)] as db
  }

}

' Interacciones Externas
hb_ui --> cloudinary : 1. Sube PDF Sustento (Multipart)
cloudinary --> hb_ui : 2. Retorna secure_url
core_ctrl --> notif_gateway : Genera y envía OTP (Aprobación Crédito)

' Conexiones Core
core_ui --> core_routes : Peticiones HTTP + JWT Token (Rol Admin)
core_routes --> core_ctrl : Orquesta lógica
core_ctrl --> core_repo : Invoca
core_repo --> db : Transacciones SQL Crudo

' Conexiones Homebanking
hb_ui --> hb_routes : Peticiones HTTP + JWT Token (Rol Cliente)\n(+ secure_url)
hb_routes --> hb_ctrl : Orquesta lógica
hb_ctrl --> hb_repo : Invoca
hb_repo --> db : Consultas/Operaciones Cliente

@enduml
```
