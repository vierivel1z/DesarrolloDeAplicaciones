<?php
use App\Http\Controllers\CuentaController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

// Ruta para el listado general de cuentas
Route::get('/cuentas', [CuentaController::class, 'index']);

// 👇 ¡ESTA ES LA RUTA CLAVE QUE FALTABA PARA TU DASHBOARD! 👇
// React pide las cuentas filtradas por el ID del usuario
Route::get('/cuentas/{userId}', function ($userId) {
    return \App\Models\Cuenta::where('user_id', $userId)->get();
});

// Ruta para los movimientos de una cuenta
Route::get('/cuentas/{id}/movimientos', [CuentaController::class, 'movimientos']);

Route::post('/cuentas', [CuentaController::class, 'store']);

// Ruta de Login
Route::post('/login', [AuthController::class, 'login']);

// Ruta de Registro
Route::post('/register', [AuthController::class, 'register']);