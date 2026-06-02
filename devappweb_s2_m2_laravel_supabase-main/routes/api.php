<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\CuentaController;

/*
|--------------------------------------------------------------------------
| Rutas Públicas (No requieren inicio de sesión)
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);


/*
|--------------------------------------------------------------------------
| Rutas Protegidas (Solo accesibles con un Token válido desde React)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Obtener las cuentas del usuario autenticado (¡Mucho más seguro!)
    Route::get('/cuentas', [CuentaController::class, 'index']);
    
    // Si necesitas filtrar estrictamente por un ID desde el Dashboard:
    Route::get('/cuentas/usuario/{userId}', [CuentaController::class, 'getCuentasByUsuario']);

    // Detalle de movimientos y creación de cuentas
    Route::get('/cuentas/{id}/movimientos', [CuentaController::class, 'movimientos']);
    Route::post('/cuentas', [CuentaController::class, 'store']);
    
    // 👇 Aquí puedes añadir más adelante la ruta de comunicación interna de tu diagrama:
    // Route::post('/scoring/evaluar', [ScoringController::class, 'evaluar']);
});