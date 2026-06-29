# Diagrama 6: Diagrama de Estados — Ciclo de Vida de una Solicitud de Crédito

**Propósito:** Documenta todas las transiciones posibles de una solicitud desde su creación hasta el desembolso, rechazo o paso al módulo de mora, incluyendo los estados intermedios de la ruta de aprobación por niveles (Maker-Checker).

```plantuml
@startuml
skinparam stateBackgroundColor white
skinparam stateBorderColor #336699
skinparam stateArrowColor #336699
skinparam shadowing false

[*] --> EN_EVALUACION : POST /creditos/solicitar\nCliente presenta solicitud\n(elegibilidad + semáforo SBS OK)

EN_EVALUACION : Pksolicitudestado = EV
EN_EVALUACION : MAKER asigna Score PD\ny valida DTI <= 40%
EN_EVALUACION --> EVALUADA_PENDIENTE_FIRMA : MAKER evalúa\n(score, DTI, cuota calculada)
EN_EVALUACION --> RECHAZADO : DTI > 40%\no datos inválidos

state "EVALUADA_PENDIENTE_FIRMA" as EPF
EPF : Pksolicitudestado = PF
EPF : CHECKER_1 asigna TEA
EPF : Sistema genera OTP → Cliente
EPF --> ESPERANDO_FIRMA : OTP enviado al cliente

state "ESPERANDO_FIRMA" as EF
EF : Pksolicitudestado = EF
EF --> APROBADO_LISTO_DESEMBOLSO : Cliente valida OTP\n(firma digital del contrato)
EF --> RECHAZADO : OTP incorrecto\n/ timeout

' ────────── Rutas de Aprobación ──────────
state "APROBADO_LISTO_DESEMBOLSO" as ALD
ALD : Pksolicitudestado = AL
ALD : Puede llegar desde:\n- Nivel 1 (Checker 1, monto ≤ S/15k)\n- Nivel 2 (Ger. Regional, monto ≤ S/50k)\n- Nivel 3 (Comité doble firma, monto > S/50k)

note right of ALD
  **Nivel 1** (≤ S/15,000):
  CHECKER_1 aprueba directamente → AL

  **Nivel 2** (≤ S/50,000):
  GERENTE_REGIONAL aprueba → AL

  **Nivel 3** (> S/50,000):
  CHECKER_1 firma → FC (Pendiente Comité)
  COMITE resuelve → AL
end note

state "PENDIENTE_FIRMA_COMITE" as FC
FC : Pksolicitudestado = FC
FC : Primera firma (Riesgos) registrada
FC : Esperando resolución Comité
FC --> APROBADO_LISTO_DESEMBOLSO : COMITE / CHECKER_2\nda segunda firma
FC --> RECHAZADO : Comité rechaza

ALD --> DESEMBOLSADO : POST /creditos/{id}/desembolsar\n(CHECKER_2 ejecuta)

' ────────── Post Desembolso ──────────
state "DESEMBOLSADO" as DES
DES : Pksolicitudestado = DES
DES : Cuenta activa en fagcuentacredito
DES : Cronograma generado en fplanpagomes
DES : Saldo abonado a cuenta de ahorro

DES --> MORA_PREVENTIVA : 1–8 días de atraso
MORA_PREVENTIVA --> MORA_TEMPRANA : 9–30 días
MORA_TEMPRANA --> MORA_TARDIA : 31–120 días
MORA_TARDIA --> JUDICIAL : ≥ 121 días\n(CHECKER_2 autoriza)
JUDICIAL --> CASTIGADO : > 180 días\n(SUPERADMIN autoriza\ny Directorio aprueba)

CASTIGADO : Pksolicitudestado = 05
CASTIGADO : montosaldocapital = 0\nflagcastigado = 'S'
CASTIGADO --> [*] : Baja contable irreversible

RECHAZADO : Pksolicitudestado = RZ
RECHAZADO --> [*]

@enduml
```
