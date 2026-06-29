# Diagrama 3: Diagrama de Secuencia - Flujo Maker-Checker, Cloudinary y OTP

**Propósito:** Detalla la secuencia temporal y síncrona, aislando la inyección financiera del balance de las fases de validación previas.

```plantuml
@startuml
actor Cliente
actor "MAKER\n(Analista)" as Maker
actor "CHECKER\n(Mesa Control)" as Checker

participant "route_creditos.py" as Route
participant "ctrl_creditos.py" as Controller
participant "ctrl_cloudinary.py" as Cloudinary
participant "repo_creditos.py" as Repo
database "PostgreSQL" as DB

== Fase 1: Subida de Documentos (Cloudinary) ==
Cliente -> Route: POST /upload-docs (Identidad, Sustento)
Route -> Cloudinary: upload_image()
Cloudinary --> Route: Retorna URLs seguras
Route -> Controller: guardar_urls_evaluacion(urls)
Controller -> Repo: INSERT en fevalconsumo
Repo -> DB: Ejecutar SQL
DB --> Repo: OK
Repo --> Controller: OK
Controller --> Route: Response
Route --> Cliente: URLs almacenadas exitosamente

== Fase 2: Evaluación MAKER ==
Maker -> Route: POST /creditos/{id}/evaluar
Route -> Controller: evaluar_credito()
Controller -> Repo: UPDATE dsolicitud (Estado)
Repo -> DB: Ejecutar SQL
DB --> Repo: OK
Repo --> Controller: OK
Controller --> Route: Response
Route --> Maker: Solicitud Evaluada

== Fase 3: Aprobación CHECKER (Firma) ==
Checker -> Route: POST /creditos/{id}/aprobar (OTP/Firma)
Route -> Controller: gestionar_aprobacion()
Controller -> Repo: registrar_firma_checker()
Repo -> DB: Ejecutar SQL
DB --> Repo: OK
Repo --> Controller: OK
Controller --> Route: Response
Route --> Checker: Solicitud Aprobada

== Fase 4: Inyección Financiera (Desembolso) ==
Checker -> Route: POST /creditos/{id}/desembolsar
Route -> Controller: desembolsar()
note right of Controller: Inyección financiera separada\nestrictamente de la validación
Controller -> Repo: INSERT foperaciones\nUPDATE saldos
Repo -> DB: Transacción SQL atómica
DB --> Repo: OK
Repo --> Controller: OK
Controller --> Route: Response
Route --> Checker: Desembolso Exitoso
@enduml
```
