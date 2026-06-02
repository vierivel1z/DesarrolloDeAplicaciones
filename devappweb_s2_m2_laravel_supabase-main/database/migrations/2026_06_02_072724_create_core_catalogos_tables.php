<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. GentZonas
        Schema::create('GentZonas', function (Blueprint $table) {
            $table->char('nCodZona', 2)->primary();
            $table->string('cDesZona', 50);
            $table->string('cAbrZona', 20);
        });

        // 2. GENTOficinas
        Schema::create('GENTOficinas', function (Blueprint $table) {
            $table->char('cCodOficin', 3)->primary();
            $table->string('cDesOficin', 80);
            $table->char('nCodZona', 2);
            $table->char('lConEstado', 1)->default('1');
            
            $table->foreign('nCodZona')->references('nCodZona')->on('GentZonas')->onDelete('cascade');
        });

        // 3. KPYTSUBTIPCRE (Corregido sin la columna duplicada)
        Schema::create('KPYTSUBTIPCRE', function (Blueprint $table) {
            $table->char('cCodTipCre', 2);
            $table->char('cCodProduc', 2);
            $table->char('cCodSubPro', 2);
            $table->string('cDesTipCre', 50);
            $table->string('cDesProCre', 50);
            $table->string('cDesSubCre', 60); // 👈 Solo una vez
            $table->string('cDesSubTip', 60);
            $table->char('lEstado', 1)->default('1');
            
            $table->primary(['cCodTipCre', 'cCodProduc', 'cCodSubPro']);
        });

        // 4. KPYTEstCreCon
        Schema::create('KPYTEstCreCon', function (Blueprint $table) {
            $table->char('cEstCreCon', 1)->primary();
            $table->string('cDescriEst', 50);
        });

        // 5. KPYTConCredit
        Schema::create('KPYTConCredit', function (Blueprint $table) {
            $table->char('cCondicCon', 2)->primary();
            $table->string('cDesConCre', 50);
        });

        // 6. SIPTCARGOPER
        Schema::create('SIPTCARGOPER', function (Blueprint $table) {
            $table->char('cCodGruPer', 3)->primary();
            $table->string('cDesCarPer', 80);
        });

        // 7. SIPTAreaOrg
        Schema::create('SIPTAreaOrg', function (Blueprint $table) {
            $table->char('cCodArea', 3)->primary();
            $table->string('cDesArea', 80);
            $table->char('lConEstado', 1)->default('1');
        });

        // 8. GENTTipCambio
        Schema::create('GENTTipCambio', function (Blueprint $table) {
            $table->date('dFecTipCam')->primary();
            $table->decimal('nTipCamFij', 8, 4);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('GENTTipCambio');
        Schema::dropIfExists('SIPTAreaOrg');
        Schema::dropIfExists('SIPTCARGOPER');
        Schema::dropIfExists('KPYTConCredit');
        Schema::dropIfExists('KPYTEstCreCon');
        Schema::dropIfExists('KPYTSUBTIPCRE');
        Schema::dropIfExists('GENTOficinas');
        Schema::dropIfExists('GentZonas');
    }
};