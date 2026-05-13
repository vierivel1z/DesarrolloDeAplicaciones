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
}