<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Cuenta;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Creamos tu usuario principal
        $user = User::updateOrCreate(
            ['email' => 'admin@gnb.com'],
            ['name' => 'Usuario GNB', 'password' => bcrypt('123456')]
        );

        // 2. Le asignamos cuentas bancarias con dinero real
        Cuenta::updateOrCreate(
            ['numero_cuenta' => '104-987654-321'],
            ['user_id' => $user->id, 'tipo_cuenta' => 'Cuenta Ahorro Rolando', 'saldo' => 15420.50, 'moneda' => 'S/']
        );

        Cuenta::updateOrCreate(
            ['numero_cuenta' => '104-112233-445'],
            ['user_id' => $user->id, 'tipo_cuenta' => 'Cuenta Sueldo', 'saldo' => 4320.00, 'moneda' => 'S/']
        );
        
        Cuenta::updateOrCreate(
            ['numero_cuenta' => '104-556677-889'],
            ['user_id' => $user->id, 'tipo_cuenta' => 'Ahorro Dólares', 'saldo' => 1250.00, 'moneda' => '$']
        );
    }
}