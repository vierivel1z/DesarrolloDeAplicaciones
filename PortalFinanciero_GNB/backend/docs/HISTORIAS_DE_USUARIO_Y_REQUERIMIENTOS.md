# PortalFinanciero_GNB — Historias de Usuario y Requerimientos Funcionales
   
**Producto:** Banca por Internet (Homebanking - Clientes) y Core Admin (Intranet - Empleados) de **Banco GNB Perú**.  
**Backend:** FastAPI (puerto 8002) sobre PostgreSQL `bd_core_financiero` (uso exclusivo de SQL crudo con `db.execute(text("..."))`).  
**Frontend:** React + Vite (puerto 5174), adaptado a la paleta de colores de Banco GNB (Azul `#0574AF`, Naranja `#FAB27F`, Verde `#74C13A`, Gris Oscuro `#333333`, Fondo `#F4F7F9`).  
**Seguridad:** JWT (HS256) + bcrypt. Autorización basada en roles (`CLIENTE`, `MAKER`, `CHECKER_1`, `CHECKER_2`, `SUPERADMIN`) en base de datos.  

---

## 1. Alcance del Proyecto (Funcionalidades Implementadas)

**Incluido (Homebanking - Clientes):**
- Login seguro mediante Token Digital (Usuario + Token) o Clave de Internet (Usuario + Clave).
- Onboarding Digital interactivo de 5 pasos:
  1. Validación del Código de Invitación (UUID de ventanilla < 48 horas).
  2. Simulación de SMS-PIN de 6 dígitos.
  3. Simulación de Biometría SBS (Selfie).
  4. Configuración de credenciales de acceso (Usuario/Clave) y elección del Sello de Seguridad anti-phishing.
  5. Sincronización final y activación del Token Digital de 6 dígitos.
- Consulta consolidada de cuentas de ahorro pasivas:
  - `AHORRO_ROLANDO` (TEA 4.50%, capitalización diaria, mantenimiento 0.0).
  - `AHORRO_TRADICIONAL` (TEA variable, mantenimiento variable).
  - `TRANSACCIONAL_CREDITO` (Mantenimiento 0.0, sin intereses, exclusiva para préstamos).
- Consulta de créditos activos, solicitudes en evaluación, e historial de pagos.
- Transferencias monetarias entre cuentas de ahorro propias del cliente.
- Pago de cuotas de préstamos vigentes con débito en cuenta de ahorro.
- Pago de convenios de servicios públicos (Agua, Luz, Telefonía).
- Formulario de solicitud de crédito (Consumo `CO` o Microempresa `ME`), con subida asíncrona de sustento de ingresos (PDF/imagen) a Cloudinary.
- Firma digital de contratos de préstamo aprobados mediante código OTP de 6 dígitos enviado por correo.

**Incluido (Core Admin - Empleados):**
- **Dashboard Analítico Global:** KPIs financieros reales del banco (Ratio de Mora Global `4.31%`, Ratio de Cartera Pesada `4.40%` y Cobertura de Provisiones `127.40%`).
- **Bandeja Maker:**
  - Visualización y admisión de solicitudes en estado `INGRESADA`.
  - Evaluación automática de elegibilidad (Edad 23-70 años, antigüedad laboral $\ge 365$ días, y semáforo SBS de Central de Riesgo < 2).
  - Visualización de boletas de ingreso hospedadas en Cloudinary.
  - Cálculo de la cuota proyectada y el Ratio de Endeudamiento ($DTI$).
  - **Acción de Aprobación:** Escala la solicitud a `EVALUADA_PENDIENTE_FIRMA`.
  - **Acción de Rechazo (Maker):** Si $DTI > 40\%$ o semáforo SBS $\ge 2$, se habilita el botón "Rechazar Solicitud", cambiando el estado a `02` (Rechazada).
- **Bandeja Checker 1:**
  - Gestión de solicitudes en estado `EVALUADA_PENDIENTE_FIRMA`.
  - Clasificación visual por nivel de autonomía: Nivel 1 ($\le S/ 15k$), Nivel 2 ($\le S/ 50k$).
  - Simulación interactiva: Ingreso de la TEA (13% - 36%), cálculo y renderizado en tiempo real de la Tabla de Amortización Francesa (ITF 0.005%, desgravamen 0.0738%).
  - Generación del código OTP y escala a `ESPERANDO_FIRMA_CLIENTE` (Nivel 1 o 2), o derivación obligatoria a Comité `PENDIENTE_FIRMA_COMITE` (Nivel 3: $> S/ 50k$).
- **Bandeja Checker 2 (Mesa de Control & Cobranza Tardía):**
  - **Mesa de Control (Desembolsos):** 
    - Contra-firma de contratos de Nivel 3 (`PENDIENTE_FIRMA_COMITE`).
    - Desembolso final de solicitudes `APROBADO_LISTO_DESEMBOLSO`. Ejecuta una transacción atómica PostgreSQL que:
      1. Crea la cuenta `TRANSACCIONAL_CREDITO` (longitud 11 dígitos, CCI de 20 dígitos prefijo `053`).
      2. Abona los fondos del préstamo en la cuenta de ahorros seleccionada.
      3. Registra el egreso en `foperaciones` con glosa reglamentaria.
      4. Actualiza el estado del crédito a desembolsado (`03`).
  - **Cobranza (Banda Tardía):**
    - Identifica créditos con moras críticas ($\ge 121$ días de atraso).
    - Muestra la línea de tiempo (*timeline*) con gestiones fallidas registradas.
    - Botón para derivar a "Cartera Judicial" (`flagjudicial = 'S'`, estado `04`).
- **Bandeja Superadmin:**
  - Panel local con KPI de provisiones globales y acceso directo a la tabla `dparametros_credito`.
  - **Castigos Contables (Mora > 180 días):** Permite procesar y ejecutar de forma atómica el castigo contable de créditos incobrables (lleva a `0.00` el capital, marca `flagcastigado = 'S'`, registra la glosa oficial de Directorio en `foperaciones`, y cambia la solicitud a `05` - Castigado).

**Fuera de alcance:**
- Reportes embebidos de Power BI Service o visualizadores nativos de Power BI.
- Tarjetas de crédito físicas, inversiones, seguros complementarios, giros internacionales.

---

## 2. Actores del Sistema

| Actor | Descripción |
|---|---|
| **Cliente** | Persona natural registrada en `dcliente` y con credenciales en `usuarios_homebanking`. Único usuario interactivo del Homebanking. |
| **Maker** | Analista de riesgos en `dusuarios_admin`. Inicia, evalúa y califica las solicitudes de crédito en el Core Admin. |
| **Checker 1** | Gerente Regional de Riesgos en `dusuarios_admin`. Define la TEA y autoriza contratos enviando el OTP de firma. |
| **Checker 2** | Operador de Mesa de Control y Cobranzas en `dusuarios_admin`. Ejecuta el desembolso e inicia la vía judicial de deudores. |
| **Superadmin** | Directorio / Alta Gerencia en `dusuarios_admin`. Modifica límites del core y autoriza el castigo contable de cartera. |

---

## 3. Épicas del Sistema

- **Épica 1: Acceso, Registro y Seguridad (Onboarding & Autenticación)**
- **Épica 2: Consultas Pasivas (Cuentas, Detalles y Saldos)**
- **Épica 3: Operaciones Monetarias (Transferencias, Pagos y Servicios)**
- **Épica 4: Motor de Crédito y Admisión (Elegibilidad, SBS, Scoring, TEA, Desembolso)**
- **Épica 5: Saneamiento y Recuperaciones (Mora, Cobranza, Judicial, Castigo)**

---

## 4. Historias de Usuario (Formato Gherkin / Banco GNB)

### Épica 1: Acceso, Registro y Seguridad

#### HU-01 — Onboarding Digital de 5 Pasos
**Como** cliente nuevo de Banco GNB  
**Quiero** realizar mi onboarding digital de forma autónoma en el portal  
**Para** registrar mi usuario, configurar mis credenciales de acceso y vincular mi Token Digital.
- **Criterio 1:** Paso 1 valida que el código UUID de invitación exista en la BD y tenga menos de 48 horas de emitido en ventanilla.
- **Criterio 2:** Paso 2 valida el PIN de 6 dígitos ingresado por la UI (simulación de SMS).
- **Criterio 3:** Paso 3 realiza la validación biométrica del cliente a través de una carga simulada de selfie.
- **Criterio 4:** Paso 4 exige definir un usuario, contraseña segura y seleccionar el Sello de Seguridad anti-phishing.
- **Criterio 5:** Paso 5 asocia un Token Digital dinámico al usuario y marca la cuenta como `ACTIVO`.

#### HU-02 — Login Seguro por Canales
**Como** usuario del banco  
**Quiero** autenticarme en la Banca por Internet de forma segura mediante credenciales y claves temporales  
**Para** realizar consultas o gestionar solicitudes de crédito según mi tipo de rol.
- **Criterio 1:** Si el usuario ingresa por la ruta de cliente, debe autenticarse usando su tarjeta/usuario más su Token Digital dinámico de 6 dígitos, o alternativamente con su Clave de Internet.
- **Criterio 2:** Si el usuario es de rol administrativo (`MAKER`, `CHECKER_1`, `CHECKER_2`, `SUPERADMIN`), ingresará con su cuenta y clave de red corporativa corporativa para ser dirigido a su respectivo Panel Administrativo.

---

### Épica 2: Consultas Pasivas

#### HU-03 — Visualización de Cuentas pasivas
**Como** cliente del Homebanking  
**Quiero** consultar la lista de mis cuentas de ahorro activas  
**Para** monitorear mis fondos disponibles y rentabilidades diarias.
- **Criterio 1:** El sistema lista todas las cuentas en `dcuentaahorro` detallando: número de 11 dígitos, CCI de 20 dígitos (prefijo entidad `053`), tipo de cuenta, moneda y saldo.
- **Criterio 2:** En las cuentas de tipo `AHORRO_ROLANDO` se debe mostrar de manera prominente que su rentabilidad es diaria (TEA 4.50%).

---

### Épica 3: Operaciones Monetarias

#### HU-04 — Transferencias entre cuentas propias
**Como** deudor/ahorrista del Homebanking  
**Quiero** transferir saldo entre mis cuentas de ahorro propias  
**Para** consolidar fondos o preparar la cuenta para pagos automáticos.
- **Criterio 1:** Las transferencias solo se permiten si la cuenta de origen cuenta con saldo suficiente para cubrir el débito.
- **Criterio 2:** La transacción debe impactar en tiempo real ambas cuentas de ahorro en la tabla `fcuentaahorro` e insertar los movimientos respectivos en `foperaciones`.

#### HU-05 — Pago de Cuotas e Impuestos
**Como** cliente deudor  
**Quiero** pagar mi cuota de crédito vencida o por vencer  
**Para** evitar la acumulación de intereses moratorios y mantener mi calificación SBS en nivel Normal.
- **Criterio 1:** El sistema sugiere automáticamente pagar la cuota pendiente más antigua.
- **Criterio 2:** Al confirmar, se descuenta de la cuenta de ahorro, se marca la cuota como pagada con la fecha de hoy, y se genera un registro en `foperaciones`.

---

### Épica 4: Motor de Crédito y Admisión

#### HU-06 — Registro de Solicitud con boleta en la Nube
**Como** cliente solicitante  
**Quiero** simular y enviar una solicitud de crédito adjuntando mi sustento de ingresos  
**Para** que el área de riesgos del banco evalúe mi viabilidad crediticia.
- **Criterio 1:** El cliente especifica el monto, el plazo y adjunta su documento de sustento.
- **Criterio 2:** El frontend sube el documento a la nube de Cloudinary a través de la ruta `/creditos/upload-documento` y guarda la URL segura retornada (`secure_url`) junto con los datos de la solicitud en la tabla `dsolicitud` bajo el estado `1` (Ingresada).

#### HU-07 — Evaluation del Analista de Riesgos (MAKER)
**Como** analista de riesgos (Maker)  
**Quiero** calificar de forma restrictiva la capacidad de pago del cliente y su perfil SBS  
**Para** decidir de manera objetiva si la solicitud debe continuar en el flujo de aprobación.
- **Criterio 1:** El Maker evalúa y visualiza la boleta cargada en Cloudinary. El sistema calcula la cuota constante francesa, el Seguro de Desgravamen y el ITF, computando el ratio de endeudamiento ($DTI$).
- **Criterio 2:** Si el deudor tiene un $DTI > 40\%$ o calificación de Semáforo SBS $\ge 2$ (Deficiente o peor), el Maker tiene habilitado el botón "Rechazar Solicitud", lo que cambia el estado a `02` (Rechazada) en la base de datos.
- **Criterio 3:** Si la solicitud cumple con todos los filtros de riesgo, el Maker hace clic en "Aprobar", escalándola al estado `7` (Evaluada Pendiente de Firma).

#### HU-08 — Simulación y Firma de Contrato (CHECKER 1 & Cliente)
**Como** personal de aprobación (Checker 1)  
**Quiero** asignar la TEA final, simular la tabla de cuotas y enviar el contrato al deudor  
**Para** que el cliente firme el contrato a través de su Homebanking.
- **Criterio 1:** El Checker 1 asigna una TEA (entre 13% y 36%) y simula la tabla francesa. Si el monto es $\le S/ 15,000$ (Nivel 1) o $\le S/ 50,000$ (Nivel 2), el sistema emite y envía un código OTP de 6 dígitos al correo del cliente.
- **Criterio 2:** Si el monto es $> S/ 50,000$ (Nivel 3), al autorizar se escala obligatoriamente a la firma de Comité (`PENDIENTE_FIRMA_COMITE`).
- **Criterio 3:** El cliente ingresa a su portal, visualiza la simulación final, digita el OTP correcto de su correo y el crédito pasa a `APROBADO_LISTO_DESEMBOLSO`.

#### HU-09 — Inyección Contable y Desembolso (CHECKER 2)
**Como** personal de Mesa de Control (Checker 2)  
**Quiero** procesar la liquidación final y desembolso del crédito aprobado  
**Para** transferir los fondos del préstamo a las cuentas del cliente.
- **Criterio 1:** Para solicitudes Nivel 3 en estado `PENDIENTE_FIRMA_COMITE`, el Checker 2 puede firmar como Comité para pasarlas a listas para desembolso.
- **Criterio 2:** Al presionar "Ejecutar Desembolso" en una solicitud `APROBADO_LISTO_DESEMBOLSO`, el sistema ejecuta una transacción atómica que:
  - Crea una cuenta `TRANSACCIONAL_CREDITO` (11 dígitos, CCI prefijo `053`).
  - Abona la suma del capital neto en la cuenta.
  - Registra el movimiento contable en `foperaciones` con glosa reglamentaria.
  - Cambia el estado a `"03"` (Desembolsado).

---

### Épica 5: Saneamiento y Recuperaciones

#### HU-10 — Proceso EOD y Penalización de Puntos
**Como** proceso por lotes nocturno (Batch EOD)  
**Quiero** incrementar los días de mora de las cuentas impagas y aplicar penalizaciones de programa de lealtad  
**Para** reflejar la morosidad real en el sistema bancario.
- **Criterio 1:** El batch calcula los días de mora de las cuotas vencidas y recalcula la calificación SBS del cliente.
- **Criterio 2:** Si los días de atraso de un crédito superan los 30 días, el sistema establece a `0` los `puntos_recompensas` del deudor en `dcliente` de forma irreversible.

#### HU-11 — Recuperación Judicial (CHECKER 2)
**Como** gestor de cobranzas (Checker 2)  
**Quiero** trasladar la cuenta de un deudor no cooperativo a cartera judicial  
**Para** iniciar la cobranza coercitiva por la vía civil.
- **Criterio 1:** El sistema lista las cuentas con `diasatrasocredito >= 121` en la pestaña de cobranza tardía.
- **Criterio 2:** Al derivar a judicial, se establece `flagjudicial = 'S'`, el estado cambia a `"04"` (Judicial) y se visualiza en la UI la línea de tiempo de gestiones.

#### HU-12 — Castigo de Cartera Irrecuperable (SUPERADMIN)
**Como** Directorio del banco (Superadmin)  
**Quiero** castigar la cartera totalmente perdida del balance del banco  
**Para** sincerar los estados financieros castigando deudas sin valor de recupero.
- **Criterio 1:** Solo se listan cuentas con mora $> 180$ días.
- **Criterio 2:** Al autorizar, se ejecuta una transacción que lleva a `0.00` el saldo capital en `fagcuentacredito`, marca `flagcastigado = 'S'`, registra el castigo en `foperaciones` con la glosa oficial, y coloca el estado en `"05"` (Castigado).

---

## 5. Requerimientos Funcionales (RF)

| ID | Capa | Input | Output | Descripción del Proceso |
|---|---|---|---|---|
| **RF-01** | `Auth` | `username`, `password` o `token` | JWT Token + `role` | Autentica usuarios de red corporativa y clientes, devolviendo los claims y el rol para ruteo frontend. |
| **RF-02** | `Onb` | `codigo_invitacion` | UUID válido | Valida que la invitación UUID exista y sea menor a 48 horas. |
| **RF-03** | `Onb` | `pin_sms` | Confirmación | Compara el PIN de 6 dígitos en la UI con el código de simulación de SMS. |
| **RF-04** | `Onb` | `username`, `password`, `sello_id` | Cuenta Activa | Crea y encripta las credenciales del cliente asociándole su sello anti-phishing. |
| **RF-05** | `Cred` | Archivo PDF | `secure_url` | Sube la boleta de ingresos de manera asíncrona a la cuenta Cloudinary del banco. |
| **RF-06** | `Cred` | Datos crédito + `secure_url` | `id_solicitud` | Inserta la solicitud en `dsolicitud` en estado `1` (Ingresada). |
| **RF-07** | `Admin` | `id_solicitud` (Maker) | Aprobación / Rechazo | Evalúa filtros mínimos de elegibilidad. Calcula DTI. Si $DTI>40\%$ o SBS $\ge 2$, se bloquea la aprobación y permite el rechazo a estado `02`. |
| **RF-08** | `Admin` | `id_solicitud`, `tea` (Checker 1) | Simulación + OTP | Valida TEA (13%-36%), genera la tabla francesa y envía el OTP por correo al cliente. |
| **RF-09** | `Cred` | `id_solicitud`, `otp` (Cliente) | Contrato Firmado | Valida el OTP del correo y cambia el estado a `APROBADO_LISTO_DESEMBOLSO`. |
| **RF-10** | `Admin` | `id_solicitud` (Checker 2) | Desembolso exitoso | Transacción que crea la cuenta transaccional (CCI con prefijo `053`), abona los fondos e inserta registro en `foperaciones` en estado `03`. |
| **RF-11** | `Admin` | `id_solicitud` (Checker 2) | Crédito en Judicial | Cambia el estado a `"04"` y coloca `flagjudicial = 'S'` si la mora es $\ge 121$ días. |
| **RF-12** | `Admin` | `id_solicitud` (Superadmin) | Crédito Castigado | Transacción contable que coloca la deuda en `0.00`, marca `flagcastigado = 'S'` y asienta la baja en `foperaciones` en estado `05`. |

---

## 6. Reglas de Negocio (RN)

- **RN-01 (Identificadores GNB):** Las cuentas bancarias creadas de manera automática en el desembolso constan de 11 dígitos y el Código de Cuenta Interbancario (CCI) de 20 dígitos numéricos con el prefijo oficial de entidad de Banco GNB, el cual es **`053`**.
- **RN-02 (Mantenimiento 0.0):** Las cuentas de tipo `TRANSACCIONAL_CREDITO` están legalmente exoneradas de comisiones de mantenimiento ($S/ 0.00$).
- **RN-03 (Rentabilidad Ahorro Rolando):** Las cuentas de tipo `AHORRO_ROLANDO` capitalizan y abonan intereses diariamente mediante interés compuesto diario aplicando la fórmula:
  
  $$i_d = \left(1 + \frac{\text{TEA}}{100}\right)^{\frac{1}{360}} - 1$$
  
- **RN-04 (Restricción del DTI):** El ratio de endeudamiento calculado para la admisión de un crédito de consumo no puede exceder bajo ninguna circunstancia el **40.0%** del ingreso neto mensual del deudor.
- **RN-05 (SBS Central de Riesgos):** Si el deudor presenta una calificación del semáforo de riesgo de la SBS $\ge 2$ (Deficiente, Dudoso o Pérdida), la admisión automática queda totalmente bloqueada.
- **RN-06 (Penalización Recompensas):** Si el deudor se atrasa en sus pagos más de 30 días, el batch nocturno EOD pondrá a `0` sus puntos de recompensas de lealtad de forma permanente e irreversible.
- **RN-07 (Castigos Contables):** Las cuentas a castigar deben registrar una mora acumulada `diasatrasocredito > 180` días y contar con aprobación de Directorio (`SUPERADMIN`).