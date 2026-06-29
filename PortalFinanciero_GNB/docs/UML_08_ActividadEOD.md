# Diagrama 8: Diagrama de Actividad — Proceso EOD (End of Day) Bancario

**Propósito:** Muestra el flujo de actividades del proceso batch nocturno en sus dos variantes: EOD Ahorros (capitalización de intereses pasivos) y EOD Créditos/Mora (penalización de cuotas vencidas y actualización de categorías SBS).

```plantuml
@startuml
skinparam activityBackgroundColor white
skinparam activityBorderColor #336699
skinparam ArrowColor #336699
skinparam shadowing false

title Proceso EOD Bancario — Banco GNB\n(Batch Nocturno / Manual vía Botón Admin)

start

fork
  ' ─────────────────────────────────
  ' RAMA A: EOD AHORROS (PASIVOS)
  ' ─────────────────────────────────
  :TRIGGER: POST /admin/eod/ahorros;
  note right: Ejecutado por CHECKER_2 / SUPERADMIN

  :Consultar cuentas de ahorro activas\n(SELECT FROM fagcuentabancaria\nWHERE tipoahorro IN ('AHO','ROLANDO'));

  while (¿Hay más cuentas?) is (SÍ)
    :Calcular interés diario:\nInterés = saldo × (TEA/365);

    if (¿Tipo AHORRO_ROLANDO?) then (SÍ)
      :Capitalizar: acumular en saldo\n(interés compuesto diario);
    else (NO — Ahorro Tradicional)
      :Abonar directamente\nal saldo disponible;
    endif

    :INSERT foperaciones\n(glosa: 'INTERÉS DIARIO EOD');
    :UPDATE fagcuentabancaria\nSET montosaldodisponible += interés;
  endwhile (NO)

  :Retornar resumen:\n{cuentas_afectadas, interes_total_pagado};

fork again
  ' ─────────────────────────────────
  ' RAMA B: EOD MORA (ACTIVOS)
  ' ─────────────────────────────────
  :TRIGGER: POST /admin/eod/mora;
  note right: Ejecutado por SUPERADMIN / Admin

  :Consultar cuotas vencidas:\nSELECT FROM fplanpagomes\nWHERE codestadocuota IN ('PE','VE')\nAND fechavencimiento < CURRENT_DATE;

  while (¿Hay más cuotas vencidas?) is (SÍ)
    :Calcular días de atraso:\ndias = CURRENT_DATE − fechavencimiento;

    if (dias > 0?) then (SÍ)
      :Calcular interés moratorio:\nIM = (tasa_mora × días / 360) × capital_amortizado;

      :UPDATE fplanpagomes SET\ndiasVencido = dias\nmontomora = IM\ncodestadocuota = 'VE';

      :UPDATE fagcuentacredito SET\ndiasatrasocredito = MAX(actual, dias);

      ' Clasificación SBS
      if (dias <= 8?) then (Categoría 0 — Normal)
        :SET pkcalificacion = 0;
      elseif (dias <= 30?) then (Categoría 1 — CPP)
        :SET pkcalificacion = 1;
      elseif (dias <= 60?) then (Categoría 2 — Deficiente)
        :SET pkcalificacion = 2;
      elseif (dias <= 120?) then (Categoría 3 — Dudoso)
        :SET pkcalificacion = 3;
      else (Categoría 4 — Pérdida)
        :SET pkcalificacion = 4;
      endif

      :UPDATE dcliente\nSET pkcalificacioncrediticiainterna = categoria;
    endif
  endwhile (NO)

  :COMMIT transacción atómica;
  :Retornar:\n{cuotas_procesadas};

end fork

:Log resultado en consola Admin;

stop

@enduml
```
