<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cuentas', function (Blueprint $table) {

            $table->id();
            
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('auth.users');

            $table->string('numero')->unique();
            $table->string('cci')->unique();
            $table->enum('tipo', ['corriente', 'ahorros']);
            $table->decimal('saldo', 12, 2)->default(0);
            $table->boolean('activa')->default(true);
    $table->timestamps();
});
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cuentas');
    }
};
