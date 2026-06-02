<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. CLIMCLIENTES
        Schema::create('CLIMCLIENTES', function (Blueprint $table) {
            $table->char('cCodCliente', 12)->primary();
            $table->string('cNomCliente', 100);
            $table->char('cNumDocIde', 8);
            $table->date('dFecNacCli');
            $table->char('cSexoCli', 1);
            $table->char('cCodOficin', 3);
            
            $table->foreign('cCodOficin')->references('cCodOficin')->on('GENTOficinas')->onDelete('cascade');
        });

        // 2. SIPMPERSONAL
        Schema::create('SIPMPERSONAL', function (Blueprint $table) {
            $table->char('cCodPerson', 6)->primary();
            $table->string('cNomPerson', 100);
            $table->char('cNumDocIde', 8);
            $table->char('cCodGruPer', 3);
            $table->char('cCodArea', 3);
            $table->char('cCodOficin', 3);
            $table->date('dFecIngIns');
            $table->date('dFecCesIns')->nullable();
            
            $table->foreign('cCodGruPer')->references('cCodGruPer')->on('SIPTCARGOPER');
            $table->foreign('cCodArea')->references('cCodArea')->on('SIPTAreaOrg');
            $table->foreign('cCodOficin')->references('cCodOficin')->on('GENTOficinas');
        });

        // 3. KPYMCRECONVEN (Créditos)
        Schema::create('KPYMCRECONVEN', function (Blueprint $table) {
            $table->char('cCodCtaCre', 18)->primary();
            $table->char('cCodCliente', 12);
            $table->char('cCodUsuAna', 6);
            $table->char('cCodOficin', 3);
            $table->char('cCodTipCre', 2);
            $table->char('cCodProduc', 2);
            $table->char('cCodSubPro', 2);
            $table->char('cCodModCre', 2)->default('01');
            $table->char('cEstCreCon', 1);
            $table->decimal('nMonCapDes', 14, 4);
            $table->decimal('nMonCapPag', 14, 4)->default(0);
            $table->decimal('nMonSalNor', 14, 4)->default(0);
            $table->decimal('nMonSalVen', 14, 4)->default(0);
            $table->decimal('nMonSalJud', 14, 4)->default(0);
            $table->decimal('nTasintCom', 8, 6);
            $table->decimal('nTEACre', 10, 6);
            $table->integer('nNumCuoApr');
            $table->integer('nDiaAtrCre')->default(0);
            $table->char('cCodTipMon', 1)->default('1');
            $table->date('dFecDesCre');
            $table->char('cCodRefina', 1)->default('N');
            $table->char('cCodJudici', 1)->default('N');
            $table->char('cCodCastig', 1)->default('N');
            
            $table->foreign('cCodCliente')->references('cCodCliente')->on('CLIMCLIENTES')->onDelete('cascade');
            $table->foreign('cCodUsuAna')->references('cCodPerson')->on('SIPMPERSONAL');
            $table->foreign('cCodOficin')->references('cCodOficin')->on('GENTOficinas');
        });

        // 4. GENMCRECLI
        Schema::create('GENMCRECLI', function (Blueprint $table) {
            $table->char('cCodCtaCre', 18)->primary();
            $table->char('cCodCliente', 12);
            $table->char('cCodLinCre', 3)->default('MIC');
            $table->char('cCondicCon', 2)->default('01');
            
            $table->foreign('cCodCliente')->references('cCodCliente')->on('CLIMCLIENTES')->onDelete('cascade');
        });

        // 5. KPYDPLANPAGCRE
        Schema::create('KPYDPLANPAGCRE', function (Blueprint $table) {
            $table->integer('nIdPlanPago')->primary();
            $table->char('cCodCtaCre', 18);
            $table->integer('nNroCuota');
            $table->decimal('nMontoCuota', 14, 4);
            $table->decimal('nMontoCapit', 14, 4);
            $table->integer('nDiaVenCuo')->default(0);
            $table->date('dFecVenCuo');
            $table->char('cEstadoCuo', 1)->default('P');
            
            $table->foreign('cCodCtaCre')->references('cCodCtaCre')->on('KPYMCRECONVEN')->onDelete('cascade');
        });

        // 6. SCORING_MENSUAL (Vital para Power BI)
        Schema::create('SCORING_MENSUAL', function (Blueprint $table) {
            $table->integer('nIdScoring')->primary();
            $table->char('cCodCliente', 12);
            $table->integer('nAnio');
            $table->integer('nMes');
            $table->integer('nPuntaje');
            $table->integer('nMoraMaxima')->default(0);
            $table->decimal('nMoraPromedio', 8, 2)->default(0);
            $table->integer('nNroCreditos')->default(0);
            $table->decimal('nSaldoTotal', 14, 4)->default(0);
            $table->char('cClasifica', 1);
            
            $table->foreign('cCodCliente')->references('cCodCliente')->on('CLIMCLIENTES')->onDelete('cascade');
        });

        // 7. KPIS_CARTERA_MENSUAL (Vital para Power BI)
        Schema::create('KPIS_CARTERA_MENSUAL', function (Blueprint $table) {
            $table->integer('nIdKpi')->primary();
            $table->char('cCodOficin', 3);
            $table->integer('nAnio');
            $table->integer('nMes');
            $table->decimal('nCarteraTotal', 16, 4);
            $table->decimal('nCarteraVigente', 16, 4);
            $table->decimal('nCarteraVencida', 16, 4);
            $table->decimal('nRatioMora', 8, 4);
            $table->integer('nNroClientes');
            $table->integer('nNroCreditos');
            $table->decimal('nDesembolsos', 16, 4);
            $table->decimal('nTasaPromedio', 8, 4);
            
            $table->foreign('cCodOficin')->references('cCodOficin')->on('GENTOficinas')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('KPIS_CARTERA_MENSUAL');
        Schema::dropIfExists('SCORING_MENSUAL');
        Schema::dropIfExists('KPYDPLANPAGCRE');
        Schema::dropIfExists('GENMCRECLI');
        Schema::dropIfExists('KPYMCRECONVEN');
        Schema::dropIfExists('SIPMPERSONAL');
        Schema::dropIfExists('CLIMCLIENTES');
    }
};