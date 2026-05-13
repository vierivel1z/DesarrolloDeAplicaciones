<?php
namespace App\Services;

use App\Repositories\CuentaRepository;

class CuentaService
{
    protected $cuentaRepo;

    public function __construct(CuentaRepository $cuentaRepo)
    {
        $this->cuentaRepo = $cuentaRepo;
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
        $cuentasActuales = $this->cuentaRepo->obtenerPorUsuario($userId);
        if ($cuentasActuales->count() >= 5) {
            throw new \Exception('No puedes tener mas de 5 cuentas.');
        }
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

