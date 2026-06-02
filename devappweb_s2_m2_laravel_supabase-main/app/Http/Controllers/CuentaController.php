<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CuentaController extends Controller
{
    // 1. Obtener SOLO las cuentas del usuario autenticado (para su Dashboard)
    public function index()
    {
        // auth()->id() obtiene automáticamente el ID del usuario del Token de React
        $userId = auth()->id(); 

        if (!$userId) {
            return response()->json(['error' => 'No autorizado'], 401);
        }

        $cuentas = DB::table('cuentas')
            ->where('user_id', $userId) // Asegura que solo vea sus cuentas
            ->get();

        return response()->json($cuentas);
    }

    // 2. Método opcional si React necesita pedir explícitamente por ID en la URL
    // (Corresponde a la ruta: /api/cuentas/usuario/{userId})
    public function getCuentasByUsuario($userId)
    {
        $cuentas = DB::table('cuentas')
            ->where('user_id', $userId)
            ->get();

        return response()->json($cuentas);
    }

    // 3. Método para obtener los movimientos de una cuenta específica
    public function movimientos($id)
    {
        // Primero verificamos que la cuenta le pertenezca al usuario por seguridad
        $cuenta = DB::table('cuentas')
            ->where('id', $id)
            ->where('user_id', auth()->id())
            ->first();

        if (!$cuenta) {
            return response()->json(['error' => 'Cuenta no encontrada o no autorizada'], 404);
        }

        $movimientos = DB::table('movimientos')
            ->where('cuenta_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($movimientos);
    }
    
    // 4. Crear una nueva cuenta bancaria asociándola al usuario
    public function store(Request $request) 
    {
        // Validamos los datos antes de insertarlos en Supabase
        $validator = Validator::make($request->all(), [
            'numero_cuenta' => 'required|string|unique:cuentas,numero_cuenta',
            'tipo_cuenta'   => 'required|string',
            'saldo'         => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Insertamos incluyendo el 'user_id' de quien crea la cuenta
        $id = DB::table('cuentas')->insertGetId([
            'user_id'       => auth()->id(), // Vinculación automática
            'numero_cuenta' => $request->numero_cuenta,
            'tipo_cuenta'   => $request->tipo_cuenta,
            'saldo'         => $request->saldo,
            'created_at'    => now(),
            'updated_at'    => now()
        ]);

        return response()->json([
            'message' => 'Cuenta creada exitosamente',
            'id' => $id
        ], 201);
    }
}