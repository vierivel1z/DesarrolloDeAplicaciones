# Semana 2 M2 --- Cuentas y Saldos con Framework Laravel (PHP)

## Guia didactica completa

---

## Tabla de contenido

1. [Introduccion](#1-introduccion)
2. [Conceptos teoricos fundamentales](#2-conceptos-teoricos-fundamentales)
3. [Linea de tiempo --- Instalacion y configuracion](#3-linea-de-tiempo--instalacion-y-configuracion)
4. [Arquitectura del proyecto --- Las 5 capas](#4-arquitectura-del-proyecto--las-5-capas)
5. [Codigo por defecto de Laravel vs codigo implementado](#5-codigo-por-defecto-de-laravel-vs-codigo-implementado)
6. [Flujo completo de una peticion](#6-flujo-completo-de-una-peticion)
7. [Detalle de cada archivo implementado](#7-detalle-de-cada-archivo-implementado)
8. [Archivos modificados de Laravel](#8-archivos-modificados-de-laravel)
9. [Pruebas de los endpoints (Testing)](#9-pruebas-de-los-endpoints-testing)
10. [Resumen de comandos utilizados](#10-resumen-de-comandos-utilizados)

---

## 1. Introduccion

Este proyecto implementa un **API REST** para la gestion de **cuentas bancarias y saldos** utilizando:

- **Lenguaje:** PHP 8.5
- **Framework:** Laravel 13.x
- **Base de datos:** PostgreSQL (Supabase en la nube)
- **Autenticacion:** Laravel Sanctum (tokens)
- **Patron de arquitectura:** 5 capas (Route -> Controller -> Service -> Repository -> Model)

**Objetivo:** Construir un backend que permita crear, listar, actualizar y eliminar cuentas bancarias con reglas de negocio (maximo 5 cuentas, saldo minimo S/ 50.00, no eliminar cuentas con saldo).

---

## 2. Conceptos teoricos fundamentales

### 2.1 Que es un Framework

Un framework es un **esqueleto de codigo pre-construido** que proporciona estructura, herramientas y convenciones para desarrollar aplicaciones. Laravel es un framework para PHP que sigue el patron **MVC (Model-View-Controller)**.

**Analogia:** Si construir una aplicacion es como construir una casa, el framework es la estructura de concreto y las paredes ya levantadas. Tu solo decides la distribucion de los cuartos (tu logica de negocio).

### 2.2 API REST

**REST** (Representational State Transfer) es un estilo de arquitectura para comunicar sistemas a traves de HTTP.

| Verbo HTTP | Accion CRUD | Ejemplo                  | Descripcion              |
|------------|-------------|--------------------------|--------------------------|
| `GET`      | Read        | `GET /api/cuentas`       | Listar todas las cuentas |
| `POST`     | Create      | `POST /api/cuentas`      | Crear una nueva cuenta   |
| `GET`      | Read        | `GET /api/cuentas/1`     | Ver una cuenta especifica|
| `PUT`      | Update      | `PUT /api/cuentas/1`     | Actualizar una cuenta    |
| `DELETE`   | Delete      | `DELETE /api/cuentas/1`  | Eliminar una cuenta      |

### 2.3 Patron de arquitectura en capas

El patron de capas **separa responsabilidades** para que cada parte del codigo tenga una sola funcion:

```
Peticion HTTP
     |
     v
 [RUTA]          --> Define QUE URL activa QUE funcion
     |
     v
 [CONTROLLER]    --> Recibe la peticion, valida datos, devuelve respuesta JSON
     |
     v
 [SERVICE]       --> Contiene las REGLAS DE NEGOCIO (logica del "negocio bancario")
     |
     v
 [REPOSITORY]    --> Ejecuta las CONSULTAS a la base de datos
     |
     v
 [MODEL]         --> Representa la TABLA de la base de datos como una clase PHP
     |
     v
 [BASE DE DATOS] --> PostgreSQL en Supabase (la nube)
```

**Por que separar en capas?**

| Problema sin capas | Solucion con capas |
|---|---|
| Todo el codigo en el Controller: validacion, reglas, consultas SQL, respuestas | Cada capa tiene UNA sola responsabilidad |
| Si cambias la base de datos, tienes que reescribir todo | Solo cambias el Repository, las demas capas no se tocan |
| Imposible hacer pruebas unitarias | Puedes probar cada capa de forma independiente |
| Codigo dificil de leer con +200 lineas por metodo | Metodos cortos y enfocados en una sola tarea |

### 2.4 Inyeccion de dependencias

Es un **principio de diseno** donde una clase **no crea** sus dependencias, sino que las **recibe desde afuera**.

```php
// SIN inyeccion (acoplado) --- MAL
class CuentaController {
    public function index() {
        $service = new CuentaService(new CuentaRepository()); // El controller "sabe" como crear todo
        return $service->listarCuentas();
    }
}

// CON inyeccion (desacoplado) --- BIEN
class CuentaController {
    protected $cuentaService;

    public function __construct(CuentaService $cuentaService) {  // Laravel le "inyecta" el servicio
        $this->cuentaService = $cuentaService;
    }
}
```

**Por que?** Si manana cambias `CuentaService` por `CuentaServiceV2`, solo cambias la configuracion en `AppServiceProvider`, no todos los controllers que lo usan.

### 2.5 Eloquent ORM

**ORM** = Object-Relational Mapping. Permite trabajar con tablas de base de datos como si fueran **clases y objetos de PHP**, sin escribir SQL directamente.

```php
// Sin ORM (SQL puro):
$result = DB::select('SELECT * FROM cuentas WHERE user_id = ?', [$userId]);

// Con Eloquent ORM:
$cuentas = Cuenta::where('user_id', $userId)->get();
```

Eloquent traduce los metodos de PHP a consultas SQL automaticamente.

### 2.6 Migraciones

Las migraciones son **archivos PHP que definen la estructura de las tablas** de la base de datos. Son como un "control de versiones" para tu base de datos.

```php
// En lugar de escribir SQL:
// CREATE TABLE cuentas (id SERIAL, tipo VARCHAR, saldo DECIMAL...);

// Escribes PHP:
Schema::create('cuentas', function (Blueprint $table) {
    $table->id();
    $table->string('tipo');
    $table->decimal('saldo', 12, 2);
});
```

**Ventaja:** Cualquier desarrollador que clone el proyecto ejecuta `php artisan migrate` y tiene la misma base de datos, sin importar si usa PostgreSQL, MySQL o SQLite.

### 2.7 Contenedor de servicios (Service Container)

Laravel tiene un **contenedor de servicios** que actua como una "fabrica central" de objetos. Cuando un Controller necesita un Service, el contenedor lo crea automaticamente con todas sus dependencias resueltas.

El archivo `AppServiceProvider.php` es donde le "enseñamos" al contenedor **como construir** nuestras clases personalizadas.

---

## 3. Linea de tiempo --- Instalacion y configuracion

### FASE 1: Instalacion de PHP y Composer

**PowerShell (Administrador)** --- Verificar si PHP y Composer existen:

```powershell
php --version
#  No reconocido --- PHP no estaba instalado

composer --version
#  No reconocido --- Composer no estaba instalado
```

**Accion manual:**

1. Descargamos **PHP 8.5.4** (zip) desde `windows.php.net/download` -> VS17 x64 Thread Safe
2. Descomprimimos en `C:\php` (PHP no tiene instalador, es solo una carpeta)
3. Descargamos e instalamos **Composer-Setup.exe** desde `getcomposer.org`
4. En el instalador de Composer: apuntamos a `C:\php\php.exe` y marcamos *"Add this PHP to your path"*

**PowerShell (Administrador)** --- Verificar instalacion:

```powershell
php --version
#  PHP 8.5.4

composer --version
#  Composer 2.9.5
```

> **Concepto:** Laravel necesita **PHP** para ejecutar el codigo y **Composer** para descargar las librerias del framework. Composer es el **gestor de paquetes de PHP** (equivalente a `npm` en JavaScript o `pip` en Python).

---

### FASE 2: Crear el proyecto Laravel

**VS Code Terminal (PowerShell):**

```powershell
composer create-project laravel/laravel .
# Crea el proyecto Laravel en la carpeta actual (s2_m2_supabase)
# El punto "." significa "aqui mismo, no crees subcarpeta"
```

> **Nota:** Fallo la primera vez porque faltaba la extension `fileinfo` de PHP.

---

### FASE 3: Habilitar extensiones PHP

**PowerShell (Administrador)** --- Cada comando activa una extension en `php.ini`:

```powershell
# Extension 1: fileinfo (requerida por Laravel para manejar archivos)
(Get-Content C:\php\php.ini) -replace ';extension=fileinfo', 'extension=fileinfo' | Set-Content C:\php\php.ini

# Extension 2: pdo_sqlite (requerida para base de datos SQLite local)
(Get-Content C:\php\php.ini) -replace ';extension=pdo_sqlite', 'extension=pdo_sqlite' | Set-Content C:\php\php.ini

# Extension 3: pdo_pgsql (driver para conectar con PostgreSQL/Supabase)
(Get-Content C:\php\php.ini) -replace ';extension=pdo_pgsql', 'extension=pdo_pgsql' | Set-Content C:\php\php.ini

# Extension 4: pgsql (funciones adicionales de PostgreSQL)
(Get-Content C:\php\php.ini) -replace ';extension=pgsql', 'extension=pgsql' | Set-Content C:\php\php.ini

# Extension 5: zip (para que Composer descargue paquetes mas rapido)
(Get-Content C:\php\php.ini) -replace ';extension=zip', 'extension=zip' | Set-Content C:\php\php.ini
```

> **Por que PowerShell como Administrador?** Porque `C:\php\php.ini` esta en una carpeta protegida del sistema.
>
> **Que hace cada comando?** Busca la linea comentada (`;extension=xxx`) en `php.ini` y le quita el `;` para activarla (`extension=xxx`).

| Extension    | Para que sirve                                    |
|-------------|--------------------------------------------------|
| `fileinfo`  | Laravel la necesita para detectar tipos de archivo|
| `pdo_sqlite`| Driver de SQLite (base de datos local por defecto)|
| `pdo_pgsql` | Driver de PostgreSQL (conexion con Supabase)      |
| `pgsql`     | Funciones adicionales de PostgreSQL               |
| `zip`       | Composer descarga paquetes `.zip` mas rapido      |

---

### FASE 4: Instalar dependencias de Laravel

**VS Code Terminal:**

```powershell
composer install
# Descarga todas las librerias que Laravel necesita
# Crea la carpeta "vendor/" con +100 paquetes
```

> **Concepto:** `vendor/` es la carpeta donde Composer guarda todas las dependencias. **Nunca se sube a Git** (esta en `.gitignore`). El archivo `composer.json` define que paquetes se necesitan y `composer.lock` fija las versiones exactas.

---

### FASE 5: Configurar Laravel

**VS Code Terminal:**

```powershell
# 1. Generar clave de encriptacion
php artisan key:generate
# Genera APP_KEY=base64:xxxxx en el archivo .env
# Sin esta clave, Laravel no puede arrancar

# 2. Crear base de datos SQLite local (temporal)
New-Item -Path database/database.sqlite -ItemType File

# 3. Ejecutar migraciones iniciales
php artisan migrate
# Crea las tablas: users, password_reset_tokens, sessions, cache, jobs

# 4. Instalar sistema de API con Sanctum
php artisan install:api
# Crea: routes/api.php y la migracion de personal_access_tokens
```

> **Concepto:** `php artisan` es la **herramienta de linea de comandos de Laravel**. "Artisan" significa artesano. Cada subcomando (`migrate`, `serve`, `make:migration`) es una tarea automatizada que Laravel ejecuta por ti.

---

### FASE 6: Crear estructura del M2

**VS Code Terminal:**

```powershell
# Crear carpetas para las capas Service y Repository
mkdir app/Services, app/Repositories

# Crear archivos vacios
New-Item -Path app/Services/CuentaService.php -ItemType File
New-Item -Path app/Repositories/CuentaRepository.php -ItemType File
```

> **Concepto:** Laravel por defecto solo trae las carpetas `Models/`, `Http/Controllers/` y `Providers/`. Las carpetas `Services/` y `Repositories/` las creamos **nosotros** para implementar la arquitectura de 5 capas. Esto no es obligatorio en Laravel, pero es una **buena practica profesional**.

---

### FASE 7: Arreglar problema de BOM

**PowerShell (Administrador):**

```powershell
[System.IO.File]::WriteAllText(
    "ruta\AppServiceProvider.php",
    (Get-Content "ruta\AppServiceProvider.php" -Raw).TrimStart(),
    [System.Text.UTF8Encoding]::new($false)
)
```

> **Que es BOM?** BOM (Byte Order Mark) es un caracter invisible (`\xEF\xBB\xBF`) que algunos editores agregan al inicio de archivos UTF-8. PHP requiere que `<?php` sea **lo primero** del archivo. Si hay un BOM antes, PHP lanza el error: *"Namespace declaration has to be the very first statement"*.

---

### FASE 8: Conectar con Supabase

**Editar `.env`:**

```env
DB_CONNECTION=pgsql
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=tu_password
```

**VS Code Terminal:**

```powershell
# Verificar que el driver PostgreSQL esta activo
php -m | Select-String pgsql
# Resultado esperado: pdo_pgsql y pgsql

# Migrar tablas a Supabase
php artisan migrate

# Crear migracion para la tabla cuentas
php artisan make:migration create_cuentas_table

# Ejecutar la nueva migracion
php artisan migrate
```

> **Concepto:** Supabase es un servicio en la nube que ofrece una base de datos **PostgreSQL** gestionada. Al cambiar `DB_CONNECTION=sqlite` por `DB_CONNECTION=pgsql` y configurar el host, Laravel ahora envia todas las consultas SQL a Supabase en lugar de al archivo local `.sqlite`.

---

### FASE 9: Levantar y probar

```powershell
php artisan serve
# Inicia el servidor en http://127.0.0.1:8000
```

**Endpoints disponibles:**

| Metodo   | URL                              | Descripcion                  |
|----------|----------------------------------|------------------------------|
| `GET`    | `/api/cuentas`                   | Listar todas las cuentas     |
| `GET`    | `/api/cuentas?user_id=uuid`      | Cuentas de un usuario        |
| `POST`   | `/api/cuentas`                   | Crear una cuenta             |
| `GET`    | `/api/cuentas/{id}`              | Ver una cuenta               |
| `PUT`    | `/api/cuentas/{id}`              | Actualizar una cuenta        |
| `DELETE` | `/api/cuentas/{id}`              | Eliminar una cuenta          |
| `GET`    | `/api/cuentas-resumen`           | Resumen de cuentas y saldos  |

---

## 4. Arquitectura del proyecto --- Las 5 capas

```
d:\GuillEdu\BackEnd\Laravel\s2_m2_supabase\
|
|-- routes/
|   |-- api.php                  -----> CAPA 1: RUTAS (URLs del API)
|
|-- app/
|   |-- Http/Controllers/
|   |   |-- CuentaController.php -----> CAPA 2: CONTROLADOR (recibe y responde)
|   |
|   |-- Services/
|   |   |-- CuentaService.php    -----> CAPA 3: SERVICIO (reglas de negocio)
|   |
|   |-- Repositories/
|   |   |-- CuentaRepository.php -----> CAPA 4: REPOSITORIO (consultas BD)
|   |
|   |-- Models/
|   |   |-- Cuenta.php           -----> CAPA 5: MODELO (representacion de tabla)
|   |
|   |-- Providers/
|       |-- AppServiceProvider.php ---> CONFIGURACION (inyeccion de dependencias)
|
|-- database/migrations/
|   |-- ...create_cuentas_table.php --> MIGRACION (estructura de la tabla)
|
|-- bootstrap/
|   |-- app.php                  -----> CONFIGURACION (registro de rutas API)
```

### Por que esta arquitectura y no todo en el Controller?

Imaginemos un Controller "gordo" sin capas:

```php
//  ANTI-PATRON: Controller con toda la logica mezclada
class CuentaController {
    public function store(Request $request) {
        $datos = $request->validate([...]);                    // Validacion
        $cuentas = Cuenta::where('user_id', auth()->id());     // Consulta BD
        if ($cuentas->count() >= 5) throw new Exception(...);  // Regla de negocio
        if ($datos['saldo'] < 50) throw new Exception(...);    // Regla de negocio
        $cuenta = Cuenta::create($datos);                      // Consulta BD
        return response()->json($cuenta);                      // Respuesta
    }
}
```

El problema: si este controller crece a 20 metodos, cada uno con 50 lineas de logica mezclada, el archivo se vuelve **inmantenible**. Con capas:

```php
//  PATRON CORRECTO: Cada capa con su responsabilidad
class CuentaController {
    public function store(Request $request) {
        $datos = $request->validate([...]);                              // Solo validacion
        $cuenta = $this->cuentaService->crearCuenta($datos, auth()->id()); // Delega al Service
        return response()->json($cuenta);                                // Solo respuesta
    }
}
```

---

## 5. Codigo por defecto de Laravel vs codigo implementado

### 5.1 Archivos que Laravel genera por defecto (NO los tocamos)

Estos archivos se crearon automaticamente con `composer create-project laravel/laravel .`:

| Archivo | Que hace |
|---------|----------|
| `database/migrations/0001_01_01_000000_create_users_table.php` | Crea tablas `users`, `password_reset_tokens`, `sessions` |
| `database/migrations/0001_01_01_000001_create_cache_table.php` | Crea tablas `cache`, `cache_locks` |
| `database/migrations/0001_01_01_000002_create_jobs_table.php` | Crea tablas `jobs`, `job_batches`, `failed_jobs` |
| `app/Http/Controllers/Controller.php` | Clase base vacia que heredan los controllers |
| `app/Models/User.php` | Modelo del usuario con autenticacion |
| `routes/web.php` | Rutas para paginas web (HTML) |
| `bootstrap/app.php` | Configuracion central de la aplicacion |
| `.env` | Variables de entorno (base de datos, claves) |

**Migracion de users (generada por Laravel):**

```php
// database/migrations/0001_01_01_000000_create_users_table.php
//  GENERADO POR LARAVEL --- NO MODIFICADO
Schema::create('users', function (Blueprint $table) {
    $table->id();                              // Columna "id" autoincremental
    $table->string('name');                    // Nombre del usuario
    $table->string('email')->unique();         // Email unico
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');                // Password hasheada
    $table->rememberToken();                   // Token "recordarme"
    $table->timestamps();                      // created_at y updated_at
});
```

### 5.2 Archivo generado por `php artisan install:api`

```php
// database/migrations/2026_04_02_112623_create_personal_access_tokens_table.php
//  GENERADO POR SANCTUM --- NO MODIFICADO
Schema::create('personal_access_tokens', function (Blueprint $table) {
    $table->id();
    $table->morphs('tokenable');    // Relacion polimorfica (user_id + user_type)
    $table->text('name');           // Nombre del token ("mi-app-movil")
    $table->string('token', 64)->unique();  // El token encriptado
    $table->text('abilities')->nullable();   // Permisos del token
    $table->timestamp('last_used_at')->nullable();
    $table->timestamp('expires_at')->nullable()->index();
    $table->timestamps();
});
```

### 5.3 Archivos NUEVOS que creamos nosotros

| Archivo | Capa | Por que lo creamos |
|---------|------|--------------------|
| `routes/api.php` | Ruta | Define las URLs del API de cuentas |
| `app/Http/Controllers/CuentaController.php` | Controller | Recibe peticiones HTTP y devuelve JSON |
| `app/Services/CuentaService.php` | Service | Contiene las reglas de negocio bancarias |
| `app/Repositories/CuentaRepository.php` | Repository | Ejecuta consultas Eloquent a la BD |
| `app/Models/Cuenta.php` | Model | Representa la tabla `cuentas` como clase PHP |
| `database/migrations/..._create_cuentas_table.php` | Migracion | Define la estructura de la tabla `cuentas` |

### 5.4 Archivos de Laravel que MODIFICAMOS

| Archivo | Que cambiamos | Por que |
|---------|---------------|---------|
| `app/Providers/AppServiceProvider.php` | Agregamos `register()` con singletons | Para que Laravel sepa como inyectar nuestro Service y Repository |
| `bootstrap/app.php` | Agregamos la linea `api:` en `withRouting` | Para que Laravel cargue nuestro archivo `routes/api.php` |
| `.env` | Cambiamos `DB_CONNECTION` de `sqlite` a `pgsql` | Para conectar con Supabase en lugar de SQLite local |

---

## 6. Flujo completo de una peticion

Veamos paso a paso que sucede cuando un usuario hace `GET /api/cuentas?user_id=abc123`:

### Paso 1: La RUTA identifica que Controller llamar

```php
// routes/api.php
Route::apiResource('cuentas', CuentaController::class);
```

`apiResource` genera automaticamente las rutas REST. `GET /api/cuentas` se mapea al metodo `index()` del `CuentaController`.

### Paso 2: El CONTROLLER recibe la peticion

```php
// app/Http/Controllers/CuentaController.php
public function index(Request $request)
{
    $userId = $request->query('user_id', auth()->id());  // Lee ?user_id=abc123
    $cuentas = $this->cuentaService->listarCuentas($userId);  // Delega al Service
    return response()->json(['success' => true, 'data' => $cuentas]);  // Devuelve JSON
}
```

El Controller **NO consulta la base de datos directamente**. Solo:
1. Extrae los parametros de la peticion
2. Llama al Service
3. Devuelve la respuesta JSON

### Paso 3: El SERVICE aplica reglas de negocio

```php
// app/Services/CuentaService.php
public function listarCuentas(?string $userId)
{
    return $this->cuentaRepo->obtenerPorUsuario($userId);
}
```

En `listarCuentas` no hay reglas especiales, pero en `crearCuenta` si:

```php
public function crearCuenta(array $datos, string $userId)
{
    $cuentasActuales = $this->cuentaRepo->obtenerPorUsuario($userId);
    if ($cuentasActuales->count() >= 5) {
        throw new \Exception('No puedes tener mas de 5 cuentas.');  // REGLA 1
    }
    if ($datos['saldo'] < 50) {
        throw new \Exception('El saldo inicial minimo es S/ 50.00.');  // REGLA 2
    }
    return $this->cuentaRepo->crear(array_merge($datos, ['user_id' => $userId]));
}
```

**Reglas de negocio implementadas:**
- Maximo 5 cuentas por usuario
- Saldo inicial minimo de S/ 50.00
- No se puede eliminar una cuenta con saldo > 0

### Paso 4: El REPOSITORY ejecuta la consulta

```php
// app/Repositories/CuentaRepository.php
public function obtenerPorUsuario(?string $userId)
{
    if (!$userId) {
        return Cuenta::orderBy('tipo')->get();  // Sin filtro: todas las cuentas
    }
    return Cuenta::where('user_id', $userId)->orderBy('tipo')->get();  // Filtrado
}
```

`Cuenta::where(...)` usa **Eloquent ORM** para generar:
```sql
SELECT * FROM cuentas WHERE user_id = 'abc123' ORDER BY tipo ASC;
```

### Paso 5: El MODEL define la tabla

```php
// app/Models/Cuenta.php
class Cuenta extends Model
{
    protected $table      = 'cuentas';
    protected $fillable   = ['user_id', 'tipo', 'numero_cuenta', 'saldo', 'moneda'];
    const UPDATED_AT      = null;    // La tabla en Supabase no tiene esta columna
    protected $casts      = ['saldo' => 'decimal:2', 'created_at' => 'datetime'];
}
```

- `$table`: nombre de la tabla en la BD
- `$fillable`: columnas que se pueden llenar con `Cuenta::create([...])`
- `const UPDATED_AT = null`: desactiva `updated_at` (la tabla en Supabase no tiene esa columna)
- `$casts`: convierte `saldo` a decimal con 2 decimales automaticamente

### Diagrama del flujo completo

```
 Cliente (navegador/Postman)
    |
    | GET /api/cuentas?user_id=abc123
    v
 [routes/api.php]  --> Route::apiResource('cuentas', CuentaController::class)
    |
    | Llama a: CuentaController@index
    v
 [CuentaController]  --> Lee user_id del query string
    |
    | Llama a: $this->cuentaService->listarCuentas($userId)
    v
 [CuentaService]  --> (aqui irian reglas de negocio si aplican)
    |
    | Llama a: $this->cuentaRepo->obtenerPorUsuario($userId)
    v
 [CuentaRepository]  --> Cuenta::where('user_id', $userId)->get()
    |
    | Eloquent genera: SELECT * FROM cuentas WHERE user_id = 'abc123'
    v
 [Cuenta (Model)]  --> Mapea cada fila de la BD a un objeto PHP
    |
    v
 [PostgreSQL - Supabase]  --> Ejecuta el SQL y devuelve los datos
    |
    v
 Respuesta JSON al cliente:
 {
   "success": true,
   "data": [
     { "id": 1, "tipo": "ahorro", "saldo": "150.00", "moneda": "PEN" },
     { "id": 2, "tipo": "corriente", "saldo": "500.00", "moneda": "USD" }
   ]
 }
```

---

## 7. Detalle de cada archivo implementado

### 7.1 Migracion --- `create_cuentas_table.php`

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cuentas', function (Blueprint $table) {
            $table->id();                                              // BIGINT autoincremental
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // FK a users.id
            $table->string('tipo');                                    // "corriente" o "ahorro"
            $table->string('numero_cuenta', 20);                       // Numero de cuenta bancaria
            $table->decimal('saldo', 12, 2)->default(0);               // Saldo con 2 decimales
            $table->string('moneda', 3)->default('PEN');               // PEN o USD
            $table->timestamps();                                      // created_at y updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cuentas');  // Rollback: elimina la tabla
    }
};
```

**Conceptos clave:**
- `foreignId('user_id')->constrained()`: Crea una **clave foranea** que apunta a `users.id`. `onDelete('cascade')` significa que si se borra un usuario, sus cuentas se borran automaticamente.
- `decimal(12, 2)`: Hasta 12 digitos totales, 2 decimales. Maximo: 9,999,999,999.99
- `up()` crea la tabla, `down()` la elimina (rollback)

### 7.2 Model --- `Cuenta.php`

```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cuenta extends Model
{
    protected $table      = 'cuentas';                                    // Nombre de la tabla
    protected $fillable   = ['user_id', 'tipo', 'numero_cuenta', 'saldo', 'moneda']; // Campos asignables
    const UPDATED_AT      = null;       // La tabla en Supabase no tiene columna updated_at
    protected $casts      = [
        'saldo'      => 'decimal:2',    // PHP trata el saldo como decimal, no string
        'created_at' => 'datetime',     // PHP trata la fecha como objeto Carbon
    ];

    public function transacciones()
    {
        return $this->hasMany(Transaccion::class);  // Relacion 1:N (preparado para M3)
    }
}
```

**Conceptos clave:**
- `$fillable`: Proteccion contra **mass assignment**. Solo estos campos se pueden llenar con `Cuenta::create([...])`. Sin esto, un atacante podria enviar `user_id=admin` en el JSON y tomar control de cuentas ajenas.
- `const UPDATED_AT = null`: Desactiva la columna `updated_at` porque la tabla `cuentas` en Supabase no la tiene. Sin esto, Laravel intenta escribir en una columna que no existe y lanza error.
- `$casts`: Laravel convierte automaticamente los tipos al leer/escribir de la BD.
- `hasMany`: Define una relacion uno-a-muchos (una cuenta tiene muchas transacciones).

### 7.3 Repository --- `CuentaRepository.php`

```php
<?php
namespace App\Repositories;

use App\Models\Cuenta;

class CuentaRepository
{
    // Obtener cuentas de un usuario (o todas si no hay userId)
    public function obtenerPorUsuario(?string $userId)
    {
        if (!$userId) {
            return Cuenta::orderBy('tipo')->get();
        }
        return Cuenta::where('user_id', $userId)->orderBy('tipo')->get();
    }

    // Obtener una cuenta por ID, opcionalmente verificando que pertenezca al usuario
    public function obtenerPorIdYUsuario(string $id, ?string $userId)
    {
        $query = Cuenta::where('id', $id);
        if ($userId) {
            $query->where('user_id', $userId);
        }
        return $query->firstOrFail();
    }

    // Crear una cuenta nueva
    public function crear(array $datos)
    {
        return Cuenta::create($datos);
    }

    // Actualizar una cuenta existente
    public function actualizar(Cuenta $cuenta, array $datos)
    {
        $cuenta->update($datos);
        return $cuenta;
    }

    // Eliminar una cuenta
    public function eliminar(Cuenta $cuenta)
    {
        return $cuenta->delete();
    }

    // Sumar todos los saldos de un usuario
    public function obtenerSaldoTotal(string $userId)
    {
        return Cuenta::where('user_id', $userId)->sum('saldo');
    }
}
```

**Conceptos clave:**
- El Repository **solo habla con la base de datos**. No valida, no lanza excepciones de negocio, no devuelve JSON.
- `string $id`: Los IDs en Supabase son **UUIDs** (texto), no numeros enteros. Por eso se usa `string` en lugar de `int`.
- `?string $userId`: El `?` significa que puede ser `null` (nullable). Cuando es `null` (rutas publicas sin autenticacion), busca la cuenta solo por `id`. Cuando tiene valor, verifica ademas que pertenezca al usuario.
- `firstOrFail()`: Si no encuentra el registro, lanza una excepcion `ModelNotFoundException` automaticamente.

### 7.4 Service --- `CuentaService.php`

```php
<?php
namespace App\Services;

use App\Repositories\CuentaRepository;

class CuentaService
{
    protected $cuentaRepo;

    public function __construct(CuentaRepository $cuentaRepo)
    {
        $this->cuentaRepo = $cuentaRepo;   // Inyeccion de dependencia
    }

    public function listarCuentas(?string $userId)
    {
        return $this->cuentaRepo->obtenerPorUsuario($userId);
    }

    public function obtenerCuenta(string $id, ?string $userId)
    {
        return $this->cuentaRepo->obtenerPorIdYUsuario($id, $userId);
    }

    public function crearCuenta(array $datos, string $userId)
    {
        // REGLA 1: Maximo 5 cuentas por usuario
        $cuentasActuales = $this->cuentaRepo->obtenerPorUsuario($userId);
        if ($cuentasActuales->count() >= 5) {
            throw new \Exception('No puedes tener mas de 5 cuentas.');
        }

        // REGLA 2: Saldo minimo de S/ 50.00
        if ($datos['saldo'] < 50) {
            throw new \Exception('El saldo inicial minimo es S/ 50.00.');
        }

        return $this->cuentaRepo->crear(array_merge($datos, ['user_id' => $userId]));
    }

    public function actualizarCuenta(string $id, array $datos, ?string $userId)
    {
        $cuenta = $this->cuentaRepo->obtenerPorIdYUsuario($id, $userId);
        return $this->cuentaRepo->actualizar($cuenta, $datos);
    }

    public function eliminarCuenta(string $id, ?string $userId)
    {
        $cuenta = $this->cuentaRepo->obtenerPorIdYUsuario($id, $userId);

        // REGLA 3: No eliminar cuentas con saldo
        if ($cuenta->saldo > 0) {
            throw new \Exception('No puedes eliminar una cuenta con saldo.');
        }

        return $this->cuentaRepo->eliminar($cuenta);
    }

    public function obtenerResumen(string $userId)
    {
        $cuentas    = $this->cuentaRepo->obtenerPorUsuario($userId);
        $saldoTotal = $this->cuentaRepo->obtenerSaldoTotal($userId);
        return [
            'total_cuentas' => $cuentas->count(),
            'saldo_total'   => $saldoTotal,
            'cuentas'       => $cuentas,
        ];
    }
}
```

**Conceptos clave:**
- El Service **contiene las reglas de negocio**. Si el banco cambia el limite de 5 a 10 cuentas, solo cambias **este archivo**.
- `string $id, ?string $userId`: Los IDs son UUIDs (string). El `userId` es nullable (`?`) porque en rutas publicas `auth()->id()` devuelve `null`.
- `throw new \Exception(...)`: Lanza un error que el Controller captura con `try-catch`.
- `array_merge($datos, ['user_id' => $userId])`: Agrega el `user_id` al array de datos antes de crear.

### 7.5 Controller --- `CuentaController.php`

```php
<?php
namespace App\Http\Controllers;

use App\Services\CuentaService;
use Illuminate\Http\Request;

class CuentaController extends Controller
{
    protected $cuentaService;

    public function __construct(CuentaService $cuentaService)
    {
        $this->cuentaService = $cuentaService;  // Inyeccion de dependencia
    }

    // GET /api/cuentas  o  GET /api/cuentas?user_id=uuid
    public function index(Request $request)
    {
        $userId = $request->query('user_id', auth()->id());
        $cuentas = $this->cuentaService->listarCuentas($userId);
        return response()->json(['success' => true, 'data' => $cuentas]);
    }

    // POST /api/cuentas
    public function store(Request $request)
    {
        $datos = $request->validate([
            'user_id'       => 'required|string',          // UUID del usuario (obligatorio en rutas publicas)
            'tipo'          => 'required|in:corriente,ahorro',
            'numero_cuenta' => 'required|string|max:20',
            'saldo'         => 'required|numeric|min:0',
            'moneda'        => 'in:PEN,USD',
        ]);
        try {
            $userId = $datos['user_id'];    // Extraemos el user_id
            unset($datos['user_id']);        // Lo removemos del array de datos
            $cuenta = $this->cuentaService->crearCuenta($datos, $userId);
            return response()->json(['success' => true, 'data' => $cuenta], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    // GET /api/cuentas/{id}
    public function show($id)
    {
        try {
            $cuenta = $this->cuentaService->obtenerCuenta($id, auth()->id());
            return response()->json(['success' => true, 'data' => $cuenta]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Cuenta no encontrada'], 404);
        }
    }

    // PUT /api/cuentas/{id}
    public function update(Request $request, $id)
    {
        $datos = $request->validate([
            'tipo'   => 'in:corriente,ahorro',
            'saldo'  => 'numeric|min:0',       // Permite actualizar el saldo
            'moneda' => 'in:PEN,USD',
        ]);
        try {
            $cuenta = $this->cuentaService->actualizarCuenta($id, $datos, auth()->id());
            return response()->json(['success' => true, 'data' => $cuenta]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    // DELETE /api/cuentas/{id}
    public function destroy($id)
    {
        try {
            $this->cuentaService->eliminarCuenta($id, auth()->id());
            return response()->json(['success' => true, 'message' => 'Cuenta eliminada']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    // GET /api/cuentas-resumen
    public function resumen()
    {
        $resumen = $this->cuentaService->obtenerResumen(auth()->id());
        return response()->json(['success' => true, 'data' => $resumen]);
    }
}
```

**Conceptos clave:**
- `$request->validate([...])`: Validacion automatica de Laravel. Si falla, devuelve un error 422 con los campos que fallaron.
- `'user_id' => 'required|string'`: En el POST, el `user_id` se envia en el body porque las rutas son publicas (sin autenticacion). En produccion con Sanctum, se usaria `auth()->id()`.
- `unset($datos['user_id'])`: Removemos el `user_id` del array de datos para que no se duplique al crear la cuenta (el Service lo agrega con `array_merge`).
- `'saldo' => 'numeric|min:0'`: En el PUT, se permite actualizar el saldo (necesario para poner saldo a 0 antes de eliminar).
- `response()->json([...], 201)`: Devuelve JSON con codigo HTTP 201 (Created).
- `try-catch`: Captura las excepciones del Service y las convierte en respuestas JSON con el mensaje de error.

### 7.6 Rutas --- `api.php`

```php
<?php
use App\Http\Controllers\CuentaController;
use Illuminate\Support\Facades\Route;

// Rutas publicas para pruebas
Route::apiResource('cuentas', CuentaController::class);
Route::get('cuentas-resumen', [CuentaController::class, 'resumen']);
```

**Conceptos clave:**
- `Route::apiResource('cuentas', ...)` genera automaticamente 5 rutas:

| Metodo   | URI                | Accion del Controller |
|----------|--------------------|-----------------------|
| GET      | /api/cuentas       | index()               |
| POST     | /api/cuentas       | store()               |
| GET      | /api/cuentas/{id}  | show()                |
| PUT      | /api/cuentas/{id}  | update()              |
| DELETE   | /api/cuentas/{id}  | destroy()             |

- Una sola linea de codigo genera 5 rutas REST completas. Esto es parte de las **convenciones de Laravel**.

---

## 8. Archivos modificados de Laravel

### 8.1 `app/Providers/AppServiceProvider.php`

**Antes (generado por Laravel):**
```php
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        //
    }
}
```

**Despues (modificado por nosotros):**
```php
class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        // Le decimos a Laravel COMO construir nuestras clases
        $this->app->singleton(CuentaRepository::class, function () {
            return new CuentaRepository();
        });

        $this->app->singleton(CuentaService::class, function ($app) {
            return new CuentaService($app->make(CuentaRepository::class));
        });
    }
}
```

**Que cambiamos y por que:**
- `singleton()`: Le dice a Laravel "crea UNA sola instancia de esta clase y reutilizala". Sin esto, cada peticion crearia objetos nuevos innecesariamente.
- El `CuentaService` recibe el `CuentaRepository` como parametro --- esto es la **inyeccion de dependencias** configurada.

### 8.2 `bootstrap/app.php`

**Cambio:** Se agrego la linea `api:` dentro de `withRouting`:

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',    // <-- AGREGADO: registra las rutas API
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
```

**Por que:** En Laravel 13, el archivo `routes/api.php` no existe por defecto. Se crea con `php artisan install:api`, pero hay que asegurarse de que `bootstrap/app.php` lo registre para que las rutas `/api/...` funcionen.

---

## 9. Pruebas de los endpoints (Testing)

Para probar el API se levanta el servidor con `php artisan serve` y se accede a los endpoints desde el **navegador** (para GET) o desde herramientas como **Postman** o **cURL** (para POST, PUT, DELETE).

```powershell
php artisan serve
# Servidor corriendo en http://127.0.0.1:8000
```

---

### 9.1 GET /api/cuentas --- Listar todas las cuentas

**Postman o Navegador:**
```
GET http://127.0.0.1:8000/api/cuentas
```

**Que hace:** Devuelve TODAS las cuentas de la base de datos (sin filtro de usuario).

**Respuesta esperada (HTTP 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-111111111111",
      "user_id": "d4e5f6a7-b8c9-0123-def0-444444444444",
      "tipo": "ahorro",
      "numero_cuenta": "019-0987654",
      "saldo": "3200.25",
      "moneda": "PEN",
      "created_at": "2026-04-02T23:33:12.183261Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-222222222222",
      "user_id": "d4e5f6a7-b8c9-0123-def0-444444444444",
      "tipo": "corriente",
      "numero_cuenta": "019-4567890",
      "saldo": "11350.00",
      "moneda": "PEN",
      "created_at": "2026-04-02T23:33:12.183261Z"
    }
  ]
}
```

> Se puede observar que devuelve el array `data` con todas las cuentas ordenadas por `tipo` (primero "ahorro", luego "corriente").

---

### 9.2 GET /api/cuentas?user_id={uuid} --- Cuentas de un usuario especifico

**Postman o Navegador:**
```
GET http://127.0.0.1:8000/api/cuentas?user_id=d4e5f6a7-b8c9-0123-def0-444444444444
```

**Que hace:** Filtra y devuelve solo las cuentas que pertenecen al `user_id` indicado en el query string.

**Respuesta esperada (HTTP 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-111111111111",
      "user_id": "d4e5f6a7-b8c9-0123-def0-444444444444",
      "tipo": "ahorro",
      "numero_cuenta": "019-0987654",
      "saldo": "3200.25",
      "moneda": "PEN",
      "created_at": "2026-04-02T23:33:12.183261Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-222222222222",
      "user_id": "d4e5f6a7-b8c9-0123-def0-444444444444",
      "tipo": "corriente",
      "numero_cuenta": "019-4567890",
      "saldo": "11350.00",
      "moneda": "PEN",
      "created_at": "2026-04-02T23:33:12.183261Z"
    }
  ]
}
```

> El parametro `?user_id=` se envia como **query string** en la URL. El Controller lo lee con `$request->query('user_id')` y lo pasa al Service para filtrar.

**Usuarios disponibles para probar (reemplazar con los UUID de tu Supabase):**

| user_id (UUID) | Email en Supabase |
|---|---|
| `a1b2c3d4-xxxx-xxxx-xxxx-111111111111` | cliente01@tudominio.com |
| `b2c3d4e5-xxxx-xxxx-xxxx-222222222222` | cliente02@tudominio.com |
| `c3d4e5f6-xxxx-xxxx-xxxx-333333333333` | cliente03@tudominio.com |
| `d4e5f6a7-xxxx-xxxx-xxxx-444444444444` | cliente04@tudominio.com |
| `e5f6a7b8-xxxx-xxxx-xxxx-555555555555` | cliente05@tudominio.com |

> **Nota:** Los UUID de esta guia son **referenciales**. Cada alumno debe usar los UUID reales de los usuarios creados en **su propio proyecto de Supabase** (seccion Authentication > Users).

---

### 9.3 GET /api/cuentas/{id} --- Ver una cuenta especifica

**Postman o Navegador:**
```
GET http://127.0.0.1:8000/api/cuentas/a1b2c3d4-e5f6-7890-abcd-111111111111
```

**Que hace:** Devuelve los datos de **una sola cuenta** identificada por su `id` (columna `id` de la tabla `cuentas`).

> **Diferencia con 9.2:** El endpoint 9.2 filtra por `user_id` (UUID del **usuario**) y devuelve un **array** con todas las cuentas del usuario. El endpoint 9.3 busca por `id` (UUID de la **cuenta**) y devuelve **un solo objeto**.

**Respuesta exitosa (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-111111111111",
    "user_id": "d4e5f6a7-b8c9-0123-def0-444444444444",
    "tipo": "ahorro",
    "numero_cuenta": "019-0987654",
    "saldo": "3200.25",
    "moneda": "PEN",
    "created_at": "2026-04-02T23:33:12.183261Z"
  }
}
```

**Respuesta si no existe (HTTP 404):**
```json
{
  "success": false,
  "message": "Cuenta no encontrada"
}
```

> **Nota:** `{id}` es un **parametro de ruta** (route parameter). Laravel lo extrae automaticamente de la URL y lo pasa como argumento al metodo `show($id)` del Controller. El `id` es el UUID de la **cuenta**, no del usuario.

**Como obtener el id de una cuenta:** Primero ejecuta el endpoint 9.1 o 9.2 para listar las cuentas, y copia el valor del campo `id` de la cuenta que quieras consultar.

---

### 9.4 POST /api/cuentas --- Crear una nueva cuenta

**Postman:**
- Metodo: `POST`
- URL: `http://127.0.0.1:8000/api/cuentas`
- Body > raw > JSON:

```json
{
  "user_id": "e5f6a7b8-xxxx-xxxx-xxxx-555555555555",
  "tipo": "ahorro",
  "numero_cuenta": "019-5521384",
  "saldo": 5500.00,
  "moneda": "PEN"
}
```

> **Nota:** El campo `user_id` es obligatorio porque las rutas son publicas (sin autenticacion). Usa el UUID real de un usuario de tu Supabase. En produccion con Sanctum activado, se usaria `auth()->id()` automaticamente.

**Respuesta exitosa (HTTP 201 Created):**
```json
{
  "success": true,
  "data": {
    "tipo": "ahorro",
    "numero_cuenta": "019-5521384",
    "saldo": "5500.00",
    "moneda": "PEN",
    "user_id": "e5f6a7b8-xxxx-xxxx-xxxx-555555555555",
    "created_at": "2026-04-03T02:12:36.000000Z",
    "id": "f6a7b8c9-d0e1-2345-abcd-666666666666"
  }
}
```

**cURL equivalente:**
```bash
curl -X POST http://127.0.0.1:8000/api/cuentas \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "e5f6a7b8-xxxx-xxxx-xxxx-555555555555",
    "tipo": "ahorro",
    "numero_cuenta": "019-5521384",
    "saldo": 5500.00,
    "moneda": "PEN"
  }'
```

**Respuesta si falla validacion (HTTP 422):**
```json
{
  "message": "The user id field is required.",
  "errors": {
    "user_id": ["The user id field is required."]
  }
}
```

**Respuesta si excede 5 cuentas (HTTP 400):**
```json
{
  "success": false,
  "message": "No puedes tener mas de 5 cuentas."
}
```

**Respuesta si saldo < 50 (HTTP 400):**
```json
{
  "success": false,
  "message": "El saldo inicial minimo es S/ 50.00."
}
```

> **Importante:** POST no se puede probar desde el navegador (el navegador solo hace GET al escribir una URL). Se necesita **Postman**, **cURL**, o una extension como Thunder Client en VS Code.

---

### 9.5 PUT /api/cuentas/{id} --- Actualizar una cuenta

**Postman:**
- Metodo: `PUT`
- URL: `http://127.0.0.1:8000/api/cuentas/f6a7b8c9-d0e1-2345-abcd-666666666666`
- Body > raw > JSON:

```json
{
  "saldo": "0",
  "moneda": "USD"
}
```

> Se pueden actualizar los campos `tipo`, `saldo` y `moneda`. Usa el `id` de la cuenta que obtuviste al crearla en el paso 9.4.

**Respuesta exitosa (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "id": "f6a7b8c9-d0e1-2345-abcd-666666666666",
    "user_id": "e5f6a7b8-xxxx-xxxx-xxxx-555555555555",
    "tipo": "ahorro",
    "numero_cuenta": "019-5521384",
    "saldo": "0.00",
    "moneda": "USD",
    "created_at": "2026-04-03T02:12:36.000000Z"
  }
}
```

**cURL equivalente:**
```bash
curl -X PUT http://127.0.0.1:8000/api/cuentas/f6a7b8c9-d0e1-2345-abcd-666666666666 \
  -H "Content-Type: application/json" \
  -d '{
    "saldo": "0",
    "moneda": "USD"
  }'
```

---

### 9.6 DELETE /api/cuentas/{id} --- Eliminar una cuenta

**Postman:**
- Metodo: `DELETE`
- URL: `http://127.0.0.1:8000/api/cuentas/f6a7b8c9-d0e1-2345-abcd-666666666666`
- Body: vacio (no se envia nada)

> Usa el mismo `id` de cuenta del paso 9.5. La cuenta debe tener `saldo = 0` para poder eliminarse.

**Respuesta exitosa (HTTP 200) --- solo si saldo = 0:**
```json
{
  "success": true,
  "message": "Cuenta eliminada"
}
```

**Respuesta si la cuenta tiene saldo > 0 (HTTP 400):**
```json
{
  "success": false,
  "message": "No puedes eliminar una cuenta con saldo."
}
```

**cURL equivalente:**
```bash
curl -X DELETE http://127.0.0.1:8000/api/cuentas/f6a7b8c9-d0e1-2345-abcd-666666666666
```

> **Regla de negocio:** El Service verifica que `$cuenta->saldo > 0` antes de permitir la eliminacion. Por eso primero usamos PUT para poner el saldo a 0, y luego DELETE para eliminar la cuenta.

> **Flujo de prueba recomendado:** POST (crear) -> PUT (saldo a 0) -> DELETE (eliminar)

---

### 9.7 GET /api/cuentas-resumen --- Resumen de cuentas y saldos

**Postman o Navegador:**
```
GET http://127.0.0.1:8000/api/cuentas-resumen
```

**Respuesta esperada (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "total_cuentas": 8,
    "saldo_total": "49621.50",
    "cuentas": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-111111111111",
        "user_id": "d4e5f6a7-b8c9-0123-def0-444444444444",
        "tipo": "ahorro",
        "numero_cuenta": "019-0987654",
        "saldo": "3200.25",
        "moneda": "PEN"
      },
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-222222222222",
        "user_id": "d4e5f6a7-b8c9-0123-def0-444444444444",
        "tipo": "corriente",
        "numero_cuenta": "019-4567890",
        "saldo": "11350.00",
        "moneda": "PEN"
      }
    ]
  }
}
```

> **Que calcula:** El Service llama a `obtenerSaldoTotal()` del Repository, que ejecuta `SUM(saldo)` en SQL. Devuelve la cantidad de cuentas, el saldo total y el detalle de cada cuenta.
>
> **Nota:** Los valores de `total_cuentas` y `saldo_total` varian segun los datos que cada alumno tenga en su base de datos.

---

### 9.8 Tabla resumen de pruebas

| # | Metodo | Endpoint | Probado desde | Codigo HTTP | Resultado |
|---|--------|----------|---------------|-------------|-----------|
| 1 | `GET` | `/api/cuentas` | Navegador | 200 | Lista todas las cuentas |
| 2 | `GET` | `/api/cuentas?user_id={uuid}` | Navegador | 200 | Lista cuentas filtradas por usuario |
| 3 | `GET` | `/api/cuentas/{id}` | Navegador | 200 / 404 | Muestra una cuenta o error |
| 4 | `POST` | `/api/cuentas` | Postman / cURL | 201 / 400 / 422 | Crea cuenta o muestra error de validacion |
| 5 | `PUT` | `/api/cuentas/{id}` | Postman / cURL | 200 / 400 | Actualiza tipo/saldo/moneda de una cuenta |
| 6 | `DELETE` | `/api/cuentas/{id}` | Postman / cURL | 200 / 400 | Elimina cuenta (solo si saldo = 0) |
| 7 | `GET` | `/api/cuentas-resumen` | Navegador | 200 | Resumen con total de cuentas y saldo |

### 9.9 Codigos HTTP utilizados

| Codigo | Significado | Cuando se usa en este proyecto |
|--------|-------------|-------------------------------|
| **200** | OK | Peticion exitosa (GET, PUT, DELETE) |
| **201** | Created | Recurso creado exitosamente (POST) |
| **400** | Bad Request | Error de regla de negocio (max 5 cuentas, saldo minimo, cuenta con saldo) |
| **404** | Not Found | La cuenta solicitada no existe |
| **422** | Unprocessable Entity | Error de validacion de Laravel (campos requeridos, formato incorrecto) |

---

## 10. Resumen de comandos utilizados

### Comandos de instalacion

| Comando | Donde se ejecuta | Que hace |
|---------|-------------------|----------|
| `composer create-project laravel/laravel .` | VS Code Terminal | Crea el proyecto Laravel |
| `composer install` | VS Code Terminal | Descarga dependencias en `vendor/` |

### Comandos de Artisan (Laravel)

| Comando | Que hace |
|---------|----------|
| `php artisan key:generate` | Genera `APP_KEY` en `.env` |
| `php artisan migrate` | Crea las tablas en la base de datos |
| `php artisan install:api` | Instala Sanctum y crea `routes/api.php` |
| `php artisan make:migration create_cuentas_table` | Genera archivo de migracion para `cuentas` |
| `php artisan serve` | Inicia el servidor en `http://127.0.0.1:8000` |

### Comandos de configuracion (PowerShell Administrador)

| Comando | Que hace |
|---------|----------|
| `(Get-Content php.ini) -replace ';extension=X', 'extension=X' \| Set-Content php.ini` | Activa extensiones PHP |
| `[System.IO.File]::WriteAllText(...)` | Elimina BOM de archivos PHP |
| `php -m \| Select-String pgsql` | Verifica que el driver PostgreSQL esta activo |

### Comandos de creacion de archivos

| Comando | Que hace |
|---------|----------|
| `mkdir app/Services, app/Repositories` | Crea carpetas para las capas |
| `New-Item -Path archivo.php -ItemType File` | Crea archivos vacios |

### Herramientas utilizadas

| Herramienta | Se usa para | Se ejecuta en |
|-------------|-------------|---------------|
| `composer` | Crear proyecto e instalar librerias PHP | VS Code Terminal |
| `php artisan` | Comandos de Laravel (migrate, serve, key:generate) | VS Code Terminal |
| `Get-Content ... Set-Content` | Modificar `php.ini` (habilitar extensiones) | PowerShell Administrador |
| `php -m` | Ver modulos/extensiones activas de PHP | Cualquier terminal |

---

> **Documento generado como guia didactica del Modulo 2 (M2) --- Cuentas y Saldos con Laravel + Supabase**
