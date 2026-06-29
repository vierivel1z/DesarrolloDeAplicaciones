# Diagrama 10: Diagrama de Despliegue — Infraestructura del Sistema

**Propósito:** Muestra la topología física y lógica del entorno de ejecución: los nodos donde corren los servicios, sus puertos, protocolos de comunicación y la integración con servicios externos (Cloudinary), reflejando la arquitectura real del proyecto en desarrollo local.

```plantuml
@startuml
skinparam nodeBackgroundColor white
skinparam nodeBorderColor #336699
skinparam ArrowColor #336699
skinparam shadowing false
skinparam componentStyle rectangle

title Diagrama de Despliegue — Banco GNB (Entorno Local)

node "Máquina del Desarrollador\n(Windows / localhost)" as LOCAL {

  node "Navegador Web\n(Chrome / Firefox)" as BROWSER {
    component "React App — Core Bancario\n:5173/admin/*" as CORE_UI
    component "React App — Homebanking\n:5173/*" as HB_UI
    note bottom of CORE_UI
      Rutas protegidas:\n/admin/creditos\n/admin/mora\n/admin/parametros
    end note
    note bottom of HB_UI
      Rutas del cliente:\n/inicio | /credito | /transferir\n/pago-servicios | /cuotas
    end note
  }

  node "Servidor Node.js\n(Vite Dev Server)" as VITE {
    component "Vite HMR\n:5173" as VITE_PROC
  }

  node "Servidor Python\n(Uvicorn + FastAPI)" as FASTAPI {
    component "API REST\n:8002" as API {
      component "router /auth" as R_AUTH
      component "router /cuentas" as R_CUENTAS
      component "router /creditos" as R_CRED
      component "router /mora" as R_MORA
      component "router /admin" as R_ADMIN
      component "router /operaciones" as R_OPS
      component "router /registro" as R_REG
    }
    note right of API
      JWT validado en cada request\npor RequireRole()\nMiddleware CORS: localhost:5173
    end note
  }

  node "Servidor PostgreSQL\n:5432" as PG {
    database "bd_core_financiero" as BD {
      component "Módulo Clientes\n(dcliente, dcuentacredito...)" as MOD_CLI
      component "Módulo Créditos\n(dsolicitud, fagcuentacredito\nfplanpagomes)" as MOD_CRED
      component "Módulo Ahorros\n(fagcuentabancaria, foperaciones)" as MOD_AHO
      component "Módulo Mora\n(fgestiones_cobranza)" as MOD_MORA
      component "Módulo Admin\n(dusuarios_admin, dparametros_gnb)" as MOD_ADM
    }
  }

}

cloud "Internet / Servicios Externos" as CLOUD {
  node "Cloudinary CDN" as CLOUDINARY {
    component "API Upload\n(PDF / Imágenes)" as CDN_API
    component "Almacenamiento\nSeguro HTTPS" as CDN_STORE
  }
}

' ─── Conexiones ───────────────────────────────────────

BROWSER --> VITE_PROC : HTTP :5173\n(Archivos estáticos React)

CORE_UI --> API : HTTP REST\n:8002/admin/*\nAuthorization: Bearer JWT
HB_UI --> API : HTTP REST\n:8002/*\nAuthorization: Bearer JWT

API --> BD : SQLAlchemy Core\n(SQL crudo, sin ORM)\npool_pre_ping=True

HB_UI --> CDN_API : HTTPS Multipart\n(Sube PDF sustento ingresos)
CDN_API --> CDN_STORE : Almacena archivo
CDN_STORE --> HB_UI : Retorna secure_url (HTTPS)
HB_UI --> API : Envía secure_url\nen payload JSON

note bottom of BD
  Scripts SQL versionados: 00–16
  Datos calibrados: ~1000 créditos,
  mora ~13%, 2 productos activos
end note

@enduml
```
