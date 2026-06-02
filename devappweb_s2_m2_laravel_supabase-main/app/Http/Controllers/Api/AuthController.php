<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Cuenta;

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
            /** @var \App\Models\User $user */
            $user = Auth::user();
            
            // 👇 ¡AQUÍ ESTÁ LA CLAVE! Generamos el token para React
            $token = $user->createToken('auth_token')->plainTextToken;
            
            // Retornamos éxito junto con el token
            return response()->json([
                'status' => true,
                'message' => 'Login exitoso',
                'access_token' => $token, // 👈 React guardará esto
                'token_type' => 'Bearer',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email
                ]
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
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password)
        ]);

        // 3. Mantener tu lógica: cuenta bancaria automática en Supabase
        Cuenta::create([
            'user_id' => $user->id,
            'tipo_cuenta' => 'Cuenta Ahorro Digital',
            'numero_cuenta' => '104-' . rand(100000, 999999) . '-' . rand(10, 99),
            'saldo' => 1500.00, // S/ 1500 de regalo
            'moneda' => 'S/'
        ]);

        // 👇 Generamos el token inmediatamente para que tras registrarse ya quede logueado en React
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Cuenta registrada exitosamente',
            'access_token' => $token, // 👈 También enviamos token aquí
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email
            ]
        ], 201); // 201 significa "Recurso Creado"
    }
}