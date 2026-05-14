<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Validar que nos envíen los datos
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // 2. Intentar loguear con Laravel
        if (Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            $user = Auth::user();
            
            // Retornamos éxito
            return response()->json([
                'status' => true,
                'message' => 'Login exitoso',
                'user' => $user
            ], 200);
        }

        // 3. Si falla, retornamos error
        return response()->json([
            'status' => false,
            'message' => 'Usuario o Clave Token incorrectos'
        ], 401);
    }

    public function register(Request $request)
    {
        // 1. Validamos los datos
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6'
        ]);

        // 2. Creamos al usuario
        $user = \App\Models\User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password)
        ]);

        // 3. ¡Magia! Le creamos una cuenta bancaria automática con saldo de bienvenida
        \App\Models\Cuenta::create([
            'user_id' => $user->id,
            'tipo_cuenta' => 'Cuenta Ahorro Digital',
            'numero_cuenta' => '104-' . rand(100000, 999999) . '-' . rand(10, 99),
            'saldo' => 1500.00, // S/ 1500 de regalo para probar
            'moneda' => 'S/'
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Cuenta creada exitosamente',
            'user' => $user
        ], 200);
    }
}