<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CuentaController extends Controller
{
    // Método para obtener todas las cuentas (para el Dashboard)
    public function index()
    {
        $cuentas = DB::table('cuentas')->get();
        return response()->json($cuentas);
    }

    // Método para obtener los movimientos de una cuenta específica
    public function movimientos($id)
    {
        $movimientos = DB::table('movimientos')
            ->where('cuenta_id', $id)
            ->orderBy('fecha', 'desc')
            ->get();
            
        return response()->json($movimientos);
    }
    
    public function store(Request $request) {
    $id = DB::table('cuentas')->insertGetId([
        'numero_cuenta' => $request->numero_cuenta,
        'tipo_cuenta' => $request->tipo_cuenta,
        'saldo' => $request->saldo,
        'created_at' => now()
    ]);
    return response()->json(['id' => $id], 201);
}
}