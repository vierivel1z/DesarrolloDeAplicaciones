<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cuenta extends Model
{
    protected $table      = 'cuentas';
    
    // 1. CORRECCIÓN: Cambiamos 'tipo' por 'tipo_cuenta'
    protected $fillable   = ['user_id', 'tipo_cuenta', 'numero_cuenta', 'saldo', 'moneda'];
    
    // 2. CORRECCIÓN: Eliminamos la línea de const UPDATED_AT = null; porque sí existe en la BD
    
    protected $casts      = [
        'saldo'      => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function transacciones()
    {
        return $this->hasMany(Transaccion::class);
    }
}