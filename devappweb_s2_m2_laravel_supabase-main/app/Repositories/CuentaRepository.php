<?php
namespace App\Repositories;

use App\Models\Cuenta;

class CuentaRepository
{
    public function obtenerPorUsuario(?string $userId)
    {
        if (!$userId) {
            return Cuenta::orderBy('tipo')->get();
        }
        return Cuenta::where('user_id', $userId)->orderBy('tipo')->get();
    }

    public function obtenerPorIdYUsuario(string $id, ?string $userId)
    {
        $query = Cuenta::where('id', $id);
        if ($userId) {
            $query->where('user_id', $userId);
        }
        return $query->firstOrFail();
    }

    public function crear(array $datos)
    {
        return Cuenta::create($datos);
    }

    public function actualizar(Cuenta $cuenta, array $datos)
    {
        $cuenta->update($datos);
        return $cuenta;
    }

    public function eliminar(Cuenta $cuenta)
    {
        return $cuenta->delete();
    }

    public function obtenerSaldoTotal(string $userId)
    {
        return Cuenta::where('user_id', $userId)->sum('saldo');
    }
}
