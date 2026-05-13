<?php
use App\Http\Controllers\CuentaController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

// Ruta para el listado general de cuentas
Route::get('/cuentas', [CuentaController::class, 'index']);

// Ruta para los movimientos de una cuenta
Route::get('/cuentas/{id}/movimientos', [CuentaController::class, 'movimientos']);

Route::post('/cuentas', [CuentaController::class, 'store']);

// Ruta de Login
Route::post('/login', [AuthController::class, 'login']);
